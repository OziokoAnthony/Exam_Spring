import {
  Body,
  ConflictException,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
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
    if (user.role !== 'TEACHER' && user.role !== 'ADMIN')
      throw new ConflictException('Teacher role required');
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
    const cohort = await this.prisma.cohort.findUnique({ where: { joinCode: dto.joinCode } });
    if (!cohort) throw new NotFoundException('Cohort not found');
    await this.prisma.cohortMember.createMany({
      data: [{ cohortId: cohort.id, learnerId: user.id }],
      skipDuplicates: true,
    });
    return ok({ joined: true, cohortId: cohort.id });
  }

  @Get('cohorts/:id/summary')
  @UseGuards(JwtAuthGuard)
  async summary(@Param('id') id: string, @Req() req: Request) {
    const user = getAuthUser(req);
    const cohort = await this.prisma.cohort.findUnique({
      where: { id },
      include: { members: true, assignments: true },
    });
    if (!cohort || (cohort.teacherId !== user.id && user.role !== 'ADMIN'))
      throw new NotFoundException('Cohort not found');
    const memberScores = await Promise.all(
      cohort.members.map(async (m) => {
        const scores = await this.prisma.masteryScore.findMany({
          where: { learnerId: m.learnerId },
        });
        const avg = scores.length
          ? scores.reduce((a, s) => a + Number(s.score), 0) / scores.length
          : 0;
        return { learnerId: m.learnerId, averageMastery: avg };
      }),
    );
    return ok({ cohort, memberScores });
  }

  @Post('cohorts/:id/assignments')
  @UseGuards(JwtAuthGuard)
  async assign(
    @Param('id') id: string,
    @Body(new ZodPipe(AssignSchema)) dto: z.infer<typeof AssignSchema>,
    @Req() req: Request,
  ) {
    const user = getAuthUser(req);
    const cohort = await this.prisma.cohort.findUnique({ where: { id } });
    if (!cohort || cohort.teacherId !== user.id) throw new NotFoundException('Cohort not found');
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
