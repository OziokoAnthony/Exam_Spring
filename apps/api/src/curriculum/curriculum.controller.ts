import { Controller, Get, Inject } from '@nestjs/common';

import type { PrismaClient } from '@examspring/db';

import { PRISMA } from '../database/database.module';
import { ok } from '../common/envelope';

@Controller()
export class CurriculumController {
  constructor(@Inject(PRISMA) private readonly prisma: PrismaClient) {}

  @Get('subjects')
  async subjects() {
    return ok(await this.prisma.subject.findMany({ orderBy: { name: 'asc' } }));
  }

  @Get('exams')
  async exams() {
    return ok(await this.prisma.exam.findMany({ where: { isActive: true } }));
  }

  @Get('objectives')
  async objectives() {
    return ok(await this.prisma.objective.findMany({ orderBy: { orderIndex: 'asc' }, take: 200 }));
  }
}
