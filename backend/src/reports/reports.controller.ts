import { Controller, Get, Inject, Param, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';

import { ReportsService } from './reports.service';
import { getAuthUser, JwtAuthGuard } from '../common/jwt-auth.guard';
import { ok } from '../common/envelope';

@Controller('reports')
export class ReportsController {
  constructor(@Inject(ReportsService) private readonly reports: ReportsService) {}

  @Get('learner')
  @UseGuards(JwtAuthGuard)
  async learner(@Req() req: Request) {
    const user = getAuthUser(req);
    return ok(await this.reports.getLearnerReport(user.id));
  }

  @Get('teacher/cohorts/:cohortId')
  @UseGuards(JwtAuthGuard)
  async teacherCohort(@Param('cohortId') cohortId: string, @Req() req: Request) {
    const user = getAuthUser(req);
    return ok(await this.reports.getCohortReport(cohortId, user.id, user.role));
  }

  @Get('parent/children/:learnerId')
  @UseGuards(JwtAuthGuard)
  async parentChild(@Param('learnerId') learnerId: string, @Req() req: Request) {
    const user = getAuthUser(req);
    return ok(await this.reports.getChildReport(learnerId, user.id, user.role));
  }
}
