import { Inject, Injectable, Logger } from '@nestjs/common';
import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Queue, Worker } from 'bullmq';
import type { ConnectionOptions, Job } from 'bullmq';
import { z } from 'zod';

import type { PrismaClient } from '@examspring/db';

import { PRISMA } from '../database/database.module';
import { loadEnv } from '../config/env';
import { EmailService } from '../mail/email.service';
import { renderEmail } from '../mail/templates';
import { redactPii } from '../common/redact';

const QUEUE = 'outbox';
const MAX_ATTEMPTS = 5;
const SWEEP_EVERY_MS = 60_000;
const STALE_AFTER_MS = 2 * 60_000;

const EmailPayloadSchema = z.object({
  to: z.string().email(),
  subject: z.string(),
  template: z.string(),
  data: z.record(z.string()),
});

type SendJob = { id: string };

function errorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  return String(redactPii(raw)).slice(0, 500);
}

@Injectable()
export class OutboxService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('OutboxService');
  private readonly queue: Queue;
  private worker: Worker | null = null;

  constructor(
    @Inject(PRISMA) private readonly prisma: PrismaClient,
    @Inject(EmailService) private readonly email: EmailService,
  ) {
    this.queue = new Queue(QUEUE, { connection: connection() });
  }

  async onModuleInit(): Promise<void> {
    this.worker = new Worker(QUEUE, async (job: Job) => this.handle(job), {
      connection: connection(),
    });
    await this.queue.add('sweep', {}, { repeat: { every: SWEEP_EVERY_MS }, jobId: 'outbox-sweep' });
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
    await this.queue.close();
  }

  async enqueueEmail(
    to: string,
    subject: string,
    template: string,
    data: Record<string, string>,
    aggregateId: string,
  ): Promise<void> {
    const event = await this.prisma.outboxEvent.create({
      data: {
        aggregateType: 'email',
        aggregateId,
        eventType: template,
        payload: { to, subject, template, data },
      },
    });
    await this.dispatch(event.id);
  }

  /** Safe to call repeatedly: BullMQ dedupes on jobId. */
  private async dispatch(eventId: string): Promise<void> {
    await this.queue.add('send', { id: eventId } satisfies SendJob, {
      jobId: eventId,
      attempts: MAX_ATTEMPTS,
      backoff: { type: 'exponential', delay: 5_000 },
      removeOnComplete: true,
      removeOnFail: 1_000,
    });
  }

  private async handle(job: Job): Promise<void> {
    if (job.name === 'sweep') return this.sweep();
    const parsed = z.object({ id: z.string().uuid() }).safeParse(job.data);
    if (!parsed.success) return;
    const isLastAttempt = job.attemptsMade + 1 >= (job.opts.attempts ?? 1);
    await this.process(parsed.data.id, isLastAttempt);
  }

  /** Re-dispatches events whose enqueue was lost after the DB write. */
  private async sweep(): Promise<void> {
    const stale = await this.prisma.outboxEvent.findMany({
      where: { status: 'PENDING', createdAt: { lt: new Date(Date.now() - STALE_AFTER_MS) } },
      select: { id: true },
      take: 100,
    });
    for (const event of stale) await this.dispatch(event.id);
  }

  private async process(id: string, isLastAttempt: boolean): Promise<void> {
    const event = await this.prisma.outboxEvent.findUnique({ where: { id } });
    if (!event || (event.status !== 'PENDING' && event.status !== 'FAILED')) return;
    await this.prisma.outboxEvent.update({
      where: { id },
      data: { status: 'PROCESSING', attempts: { increment: 1 } },
    });
    try {
      const payload = EmailPayloadSchema.parse(event.payload);
      await this.email.send(
        payload.to,
        payload.subject,
        renderEmail(payload.template, payload.data),
      );
      await this.prisma.outboxEvent.update({
        where: { id },
        data: { status: 'DONE', processedAt: new Date(), lastError: null },
      });
    } catch (error) {
      const message = errorMessage(error);
      this.logger.error(`Outbox ${id} failed (${event.eventType}): ${message}`);
      await this.prisma.outboxEvent.update({
        where: { id },
        data: { status: isLastAttempt ? 'DLQ' : 'FAILED', lastError: message },
      });
      throw error;
    }
  }
}

function connection(): ConnectionOptions {
  const url = new URL(loadEnv().REDIS_URL);
  return {
    host: url.hostname,
    port: Number(url.port || 6379),
    ...(url.username ? { username: decodeURIComponent(url.username) } : {}),
    ...(url.password ? { password: decodeURIComponent(url.password) } : {}),
    ...(url.protocol === 'rediss:' ? { tls: {} } : {}),
    maxRetriesPerRequest: null,
  };
}
