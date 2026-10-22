import { Controller, Get, Inject, ServiceUnavailableException } from '@nestjs/common';

import type { PrismaClient } from '@examspring/db';

import { ok } from './common/envelope';
import { PRISMA } from './database/database.module';

@Controller('health')
export class HealthController {
  constructor(@Inject(PRISMA) private readonly prisma: PrismaClient) {}

  @Get()
  async check() {
    try {
      // Documented raw-SQL exception: a no-op liveness ping has no Prisma equivalent.
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException('Database unavailable');
    }
    return ok({ status: 'ok' });
  }
}
