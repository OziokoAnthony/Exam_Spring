import { Controller, Get, Inject, Param, ParseUUIDPipe, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';

import type { PrismaClient } from '@examspring/db';

import { PRISMA } from '../database/database.module';
import { getAuthUser, JwtAuthGuard } from '../common/jwt-auth.guard';
import { ok } from '../common/envelope';
import { ReportsService } from '../reports/reports.service';

@Controller('parent')
export class ParentController {
  constructor(
    @Inject(PRISMA) private readonly prisma: PrismaClient,
    @Inject(ReportsService) private readonly reports: ReportsService,
  ) {}

  @Get('children')
  @UseGuards(JwtAuthGuard)
  async children(@Req() req: Request) {
    const user = getAuthUser(req);
    const links = await this.prisma.guardianLink.findMany({
      where: { guardianId: user.id, status: 'ACTIVE' },
      select: { learnerId: true },
    });
    const learners = await this.prisma.user.findMany({
      where: { id: { in: links.map((l) => l.learnerId) } },
      select: { id: true, fullName: true, emailVerifiedAt: true },
    });
    return ok(learners);
  }

  @Get('children/:learnerId/summary')
  @UseGuards(JwtAuthGuard)
  async summary(@Param('learnerId', ParseUUIDPipe) learnerId: string, @Req() req: Request) {
    const user = getAuthUser(req);
    return ok(await this.reports.getChildReport(learnerId, user.id, user.role));
  }
}
