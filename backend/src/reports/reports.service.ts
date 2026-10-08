import { Inject, Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { PrismaClient } from '@examspring/db';

import { PRISMA } from '../database/database.module';

@Injectable()
export class ReportsService {
  constructor(@Inject(PRISMA) private readonly prisma: PrismaClient) {}

  async getLearnerReport(learnerId: string) {
    const attempts = await this.prisma.attempt.findMany({
      where: { learnerId, submittedAt: { not: null } },
      select: { scorePct: true },
    });
    const avgScorePct = attempts.length
      ? attempts.reduce((sum, a) => sum + Number(a.scorePct ?? 0), 0) / attempts.length
      : 0;
    const masteryRows = await this.prisma.masteryScore.findMany({
      where: { learnerId },
      orderBy: { score: 'desc' },
      take: 5,
    });
    const masteryTop5 = masteryRows.map((m) => ({
      objectiveId: m.objectiveId,
      score: Number(m.score),
      attemptsCount: m.attemptsCount,
    }));
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const last7DaysAnswers = await this.prisma.attemptItem.count({
      where: { answeredAt: { gte: since }, attempt: { learnerId } },
    });
    return { attemptsCount: attempts.length, avgScorePct, masteryTop5, last7DaysAnswers };
  }

  async getCohortReport(cohortId: string, userId: string, role: string) {
    const cohort = await this.prisma.cohort.findUnique({
      where: { id: cohortId },
      include: { members: true },
    });
    if (!cohort) throw new NotFoundException('Cohort not found');
    if (cohort.teacherId !== userId && role !== 'ADMIN')
      throw new ForbiddenException('Not your cohort');
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const members = await Promise.all(
      cohort.members.map(async (m) => {
        const attempts = await this.prisma.attempt.findMany({
          where: { learnerId: m.learnerId, submittedAt: { gte: since } },
          select: { scorePct: true },
        });
        const avgScorePct = attempts.length
          ? attempts.reduce((sum, a) => sum + Number(a.scorePct ?? 0), 0) / attempts.length
          : 0;
        return { learnerId: m.learnerId, attemptsCount: attempts.length, avgScorePct };
      }),
    );
    return { cohortId: cohort.id, name: cohort.name, members };
  }

  async getChildReport(learnerId: string, guardianId: string, role: string) {
    const link = await this.prisma.guardianLink.findFirst({
      where: { guardianId, learnerId, status: 'ACTIVE' },
    });
    if (!link && role !== 'ADMIN') throw new ForbiddenException('Not your learner');
    const mastery = await this.prisma.masteryScore.findMany({ where: { learnerId } });
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const last7DaysAnswers = await this.prisma.attemptItem.count({
      where: { answeredAt: { gte: since }, attempt: { learnerId } },
    });
    return { mastery, last7DaysAnswers };
  }
}
