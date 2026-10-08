import { Body, Controller, Get, Inject, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ForbiddenException } from '@nestjs/common';
import type { Request } from 'express';
import { z } from 'zod';

import { CreateQuestionSchema, QuestionsService } from './questions.service';
import { getAuthUser, JwtAuthGuard } from '../common/jwt-auth.guard';
import { ok } from '../common/envelope';
import { ZodPipe } from '../common/zod.pipe';

function requireAdmin(req: Request) {
  const user = getAuthUser(req);
  if (user.role !== 'ADMIN') throw new ForbiddenException('Admin only');
  return user;
}

@Controller('questions')
export class QuestionsController {
  constructor(@Inject(QuestionsService) private readonly questions: QuestionsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async list(
    @Query('status') status?: string,
    @Query('subjectId') subjectId?: string,
    @Req() req?: Request,
  ) {
    if (req) requireAdmin(req);
    return ok(await this.questions.list(status, subjectId));
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Body(new ZodPipe(CreateQuestionSchema)) dto: Parameters<QuestionsService['create']>[0],
    @Req() req: Request,
  ) {
    const user = requireAdmin(req);
    return ok(await this.questions.create(dto, user.id));
  }

  @Post('bulk')
  @UseGuards(JwtAuthGuard)
  async bulk(
    @Body(new ZodPipe(z.object({ questions: z.array(CreateQuestionSchema).max(200) })))
    dto: { questions: Parameters<QuestionsService['create']>[0][] },
    @Req() req: Request,
  ) {
    const user = requireAdmin(req);
    return ok(await this.questions.createBulk(dto.questions, user.id));
  }

  @Post(':id/versions')
  @UseGuards(JwtAuthGuard)
  async newVersion(
    @Param('id') id: string,
    @Body(new ZodPipe(CreateQuestionSchema)) dto: Parameters<QuestionsService['create']>[0],
    @Req() req: Request,
  ) {
    const user = requireAdmin(req);
    return ok(await this.questions.createVersion(id, dto, user.id));
  }

  @Post(':id/approve')
  @UseGuards(JwtAuthGuard)
  async approve(@Param('id') id: string, @Req() req: Request) {
    const user = requireAdmin(req);
    return ok(await this.questions.setStatus(id, 'APPROVED', user.id));
  }

  @Post(':id/reject')
  @UseGuards(JwtAuthGuard)
  async reject(@Param('id') id: string, @Req() req: Request) {
    const user = requireAdmin(req);
    return ok(await this.questions.setStatus(id, 'REJECTED', user.id));
  }
}
