import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Inject,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { randomBytes } from 'crypto';
import { z } from 'zod';

import type { PrismaClient } from '@examspring/db';

import { PRISMA } from '../database/database.module';
import { getAuthUser, JwtAuthGuard } from '../common/jwt-auth.guard';
import { ok } from '../common/envelope';
import { ZodPipe } from '../common/zod.pipe';
import { cohortSummary } from './cohort-summary';

const CreateCohortSchema = z.object({
  name: z.string().min(1).max(120),
  examId: z.string().uuid(),
});
const JoinSchema = z.object({ joinCode: z.string().min(4) });
const AssignSchema = z.object({
  title: z.string().min(1),
  objectiveIds: z.array(z.string().uuid()).min(1),
  dueAt: z.string().datetime().optional(),
});

@Controller('teacher')
export class TeacherController {
  constructor(@Inject(PRISMA) private readonly prisma: PrismaClient) {}

  @Post('cohorts')
  @UseGuards(JwtAuthGuard)
  async createCohort(
    @Body(new ZodPipe(CreateCohortSchema)) dto: z.infer<typeof CreateCohortSchema>,
    @Req() req: Request,
  ) {
    const user = getAuthUser(req);
    if (user.role !== 'TEACHER' && user.role !== 'ADMIN') {
      throw new ForbiddenException('Teacher role required');
    }
    const exam = await this.prisma.exam.findUnique({ where: { id: dto.examId } });
    if (!exam) throw new NotFoundException('Exam not found');
    const cohort = await this.prisma.cohort.create({
      data: {
        teacherId: user.id,
        name: dto.name,
        examId: dto.examId,
        joinCode: randomBytes(3).toString('hex').toUpperCase(),
      },
    });
    return ok(cohort);
  }

  @Get('cohorts')
  @UseGuards(JwtAuthGuard)
  async listCohorts(@Req() req: Request) {
    return ok(await this.prisma.cohort.findMany({ where: { teacherId: getAuthUser(req).id } }));
  }

  @Post('cohorts/join')
  @UseGuards(JwtAuthGuard)
  async join(@Body(new ZodPipe(JoinSchema)) dto: z.infer<typeof JoinSchema>, @Req() req: Request) {
    const user = getAuthUser(req);
    if (user.role !== 'LEARNER') throw new ForbiddenException('Only learners can join a class');
    const cohort = await this.prisma.cohort.findUnique({
      where: { joinCode: dto.joinCode.toUpperCase() },
    });
    if (!cohort || cohort.archivedAt) throw new NotFoundException('Cohort not found');
    await this.prisma.cohortMember.createMany({
      data: [{ cohortId: cohort.id, learnerId: user.id }],
      skipDuplicates: true,
    });
    return ok({ joined: true, cohortId: cohort.id });
  }

  @Get('cohorts/:id/summary')
  @UseGuards(JwtAuthGuard)
  async summary(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request) {
    const user = getAuthUser(req);
    const cohort = await this.prisma.cohort.findUnique({
      where: { id },
      include: { members: true, assignments: true },
    });
    if (!cohort || (cohort.teacherId !== user.id && user.role !== 'ADMIN'))
      throw new NotFoundException('Cohort not found');
    return ok(await cohortSummary(this.prisma, cohort));
  }

  @Post('cohorts/:id/assignments')
  @UseGuards(JwtAuthGuard)
  async assign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodPipe(AssignSchema)) dto: z.infer<typeof AssignSchema>,
    @Req() req: Request,
  ) {
    const user = getAuthUser(req);
    const cohort = await this.prisma.cohort.findUnique({ where: { id } });
    if (!cohort || cohort.teacherId !== user.id) throw new NotFoundException('Cohort not found');
    const found = await this.prisma.objective.count({ where: { id: { in: dto.objectiveIds } } });
    if (found !== new Set(dto.objectiveIds).size)
      throw new NotFoundException('Objective not found');
    const assignment = await this.prisma.assignment.create({
      data: {
        cohortId: id,
        teacherId: user.id,
        title: dto.title,
        objectiveIds: dto.objectiveIds,
        ...(dto.dueAt ? { dueAt: new Date(dto.dueAt) } : {}),
      },
    });
    return ok(assignment);
  }
}
