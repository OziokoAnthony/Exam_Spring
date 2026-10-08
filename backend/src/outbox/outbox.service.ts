import { Inject, Injectable, Logger } from '@nestjs/common';
import { Queue, Worker } from 'bullmq';

import type { PrismaClient } from '@examspring/db';

import { PRISMA } from '../database/database.module';
import { loadEnv } from '../config/env';
import { EmailService } from '../mail/email.service';
import { renderEmail } from '../mail/templates';
import { redactPii } from '../common/redact';

const QUEUE = 'outbox';

@Injectable()
export class OutboxService {
  private readonly logger = new Logger('OutboxService');
  private readonly queue: Queue;

  constructor(
    @Inject(PRISMA) private readonly prisma: PrismaClient,
    @Inject(EmailService) private readonly email: EmailService,
  ) {
    this.queue = new Queue(QUEUE, { connection: this.connection() });
    new Worker(QUEUE, async (job) => this.process(job.data as { id: string }), {
      connection: this.connection(),
    });
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
    await this.queue.add('send', { id: event.id });
  }

  private async process(data: { id: string }): Promise<void> {
    const event = await this.prisma.outboxEvent.findUnique({ where: { id: data.id } });
    if (!event || event.status !== 'PENDING') return;
    await this.prisma.outboxEvent.update({
      where: { id: event.id },
      data: { status: 'PROCESSING', attempts: { increment: 1 } },
    });
    try {
      const payload = event.payload as {
        to: string;
        subject: string;
        template: string;
        data: Record<string, string>;
      };
      await this.email.send(
        payload.to,
        payload.subject,
        renderEmail(payload.template, payload.data),
      );
      await this.prisma.outboxEvent.update({
        where: { id: event.id },
        data: { status: 'DONE', processedAt: new Date() },
      });
    } catch (error) {
      this.logger.error(
        `Outbox ${event.id} failed: ${JSON.stringify(
          redactPii({
            payload: event.payload,
            error: error instanceof Error ? error.message : String(error),
          }),
        )}`,
        error instanceof Error ? error.stack : String(error),
      );
      await this.prisma.outboxEvent.update({
        where: { id: event.id },
        data: { status: 'FAILED', lastError: error instanceof Error ? error.message : 'unknown' },
      });
    }
  }

  private connection() {
    const url = new URL(loadEnv().REDIS_URL);
    const base: Record<string, unknown> = {
      host: url.hostname,
      port: Number(url.port || 6379),
    };
    if (url.username) base.username = url.username;
    if (url.password) base.password = url.password;
    if (url.protocol === 'rediss:') {
      base.tls = {};
    }
    return base;
  }
}
