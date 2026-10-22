import { Inject, Injectable } from '@nestjs/common';
import type { PrismaClient } from '@examspring/db';

import { PRISMA } from '../database/database.module';
import { OutboxService } from '../outbox/outbox.service';
import { redactPii } from '../common/redact';

@Injectable()
export class NotificationsService {
  constructor(
    @Inject(PRISMA) private readonly prisma: PrismaClient,
    @Inject(OutboxService) private readonly outbox: OutboxService,
  ) {}

  async recentOutbox() {
    const events = await this.prisma.outboxEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        eventType: true,
        status: true,
        attempts: true,
        createdAt: true,
        processedAt: true,
        lastError: true,
        payload: true,
      },
    });
    return events.map((e) => ({
      ...e,
      payload: redactPii(e.payload),
      lastError: e.lastError === null ? null : redactPii(e.lastError),
    }));
  }

  async enqueueEmail(
    dto: { to: string; subject: string; template: string; data: Record<string, string> },
    adminId: string,
  ) {
    await this.outbox.enqueueEmail(dto.to, dto.subject, dto.template, dto.data, adminId);
    return { queued: true };
  }
}
