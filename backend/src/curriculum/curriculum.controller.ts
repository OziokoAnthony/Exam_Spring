import { Controller, Get, Inject, ParseUUIDPipe, Query } from '@nestjs/common';

import type { PrismaClient } from '@examspring/db';

import { PRISMA } from '../database/database.module';
import { ok } from '../common/envelope';

const optionalUuid = new ParseUUIDPipe({ optional: true });

/** Public read-only curriculum. Rate limited by the global default. */
@Controller()
export class CurriculumController {
  constructor(@Inject(PRISMA) private readonly prisma: PrismaClient) {}

  @Get('exams')
  async exams() {
    return ok(
      await this.prisma.exam.findMany({
        where: { isActive: true },
        select: { id: true, code: true, name: true, description: true },
        orderBy: { name: 'asc' },
      }),
    );
  }

  @Get('subjects')
  async subjects(@Query('examId', optionalUuid) examId?: string) {
    return ok(
      await this.prisma.subject.findMany({
        where: examId ? { examId } : { exam: { isActive: true } },
        select: { id: true, code: true, name: true, examId: true },
        orderBy: { name: 'asc' },
        take: 500,
      }),
    );
  }

  @Get('objectives')
  async objectives(@Query('subjectId', optionalUuid) subjectId?: string) {
    return ok(
      await this.prisma.objective.findMany({
        where: subjectId ? { subjectId } : {},
        select: {
          id: true,
          subjectId: true,
          code: true,
          description: true,
          parentObjectiveId: true,
          orderIndex: true,
        },
        orderBy: { orderIndex: 'asc' },
        take: 500,
      }),
    );
  }
}
