import { Controller, ForbiddenException, Get, Inject, Param, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';

import type { PrismaClient } from '@examspring/db';

import { PRISMA } from '../database/database.module';
import { getAuthUser, JwtAuthGuard } from '../common/jwt-auth.guard';
import { ok } from '../common/envelope';

@Controller('parent')
export class ParentController {
  constructor(@Inject(PRISMA) private readonly prisma: PrismaClient) {}

  @Get('children')
  @UseGuards(JwtAuthGuard)
  async children(@Req() req: Request) {
    const user = getAuthUser(req);
    const links = await this.prisma.guardianLink.findMany({
      where: { guardianId: user.id, status: 'ACTIVE' },
    });
    const learners = await Promise.all(
      links.map((l) =>
        this.prisma.user.findUnique({
          where: { id: l.learnerId },
          select: { id: true, fullName: true, emailVerifiedAt: true },
        }),
      ),
    );
    return ok(learners.filter((l) => l !== null));
  }

  @Get('children/:learnerId/summary')
  @UseGuards(JwtAuthGuard)
  async summary(@Param('learnerId') learnerId: string, @Req() req: Request) {
    const user = getAuthUser(req);
    const link = await this.prisma.guardianLink.findFirst({
      where: { guardianId: user.id, learnerId, status: 'ACTIVE' },
    });
    if (!link && user.role !== 'ADMIN') throw new ForbiddenException('Not your learner');
    const mastery = await this.prisma.masteryScore.findMany({ where: { learnerId } });
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentItems = await this.prisma.attemptItem.count({
      where: { answeredAt: { gte: since }, attempt: { learnerId } },
    });
    return ok({ mastery, last7DaysAnswers: recentItems });
  }
}
