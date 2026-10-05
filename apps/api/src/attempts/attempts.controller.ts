import { Body, Controller, Get, Inject, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { z } from 'zod';

import { AttemptsService } from './attempts.service';
import { PracticeService } from './practice.service';
import { getAuthUser, JwtAuthGuard } from '../common/jwt-auth.guard';
import { ok } from '../common/envelope';
import { ZodPipe } from '../common/zod.pipe';

const StartSchema = z.object({ subjectId: z.string().uuid() });
const SubmitSchema = z.object({
  answers: z
    .array(z.object({ questionVersionId: z.string().uuid(), response: z.string() }))
    .max(100),
});

@Controller('attempts')
export class AttemptsController {
  constructor(
    @Inject(AttemptsService) private readonly attempts: AttemptsService,
    @Inject(PracticeService) private readonly practice: PracticeService,
  ) {}

  @Post('diagnostic')
  @UseGuards(JwtAuthGuard)
  async start(
    @Body(new ZodPipe(StartSchema)) dto: z.infer<typeof StartSchema>,
    @Req() req: Request,
  ) {
    return ok(await this.attempts.startDiagnostic(getAuthUser(req).id, dto.subjectId));
  }

  @Post(':id/submit')
  @UseGuards(JwtAuthGuard)
  async submit(
    @Param('id') id: string,
    @Body(new ZodPipe(SubmitSchema)) dto: z.infer<typeof SubmitSchema>,
    @Req() req: Request,
  ) {
    return ok(await this.attempts.submitAttempt(id, getAuthUser(req).id, dto.answers));
  }

  @Get('mastery')
  @UseGuards(JwtAuthGuard)
  async mastery(@Req() req: Request) {
    return ok(await this.attempts.getMastery(getAuthUser(req).id));
  }

  @Post('cbt')
  @UseGuards(JwtAuthGuard)
  async startCbt(
    @Body(new ZodPipe(StartSchema)) dto: z.infer<typeof StartSchema>,
    @Req() req: Request,
  ) {
    return ok(await this.practice.startCbt(getAuthUser(req).id, dto.subjectId));
  }

  @Post('practice')
  @UseGuards(JwtAuthGuard)
  async startPractice(
    @Body(new ZodPipe(StartSchema)) dto: z.infer<typeof StartSchema>,
    @Req() req: Request,
  ) {
    return ok(await this.practice.startPractice(getAuthUser(req).id, dto.subjectId));
  }

  @Post('sync')
  @UseGuards(JwtAuthGuard)
  async syncOffline(
    @Body()
    body: {
      attempts: {
        idempotencyKey: string;
        subjectId: string;
        mode: 'PRACTICE' | 'DIAGNOSTIC' | 'CBT';
        answers: { questionVersionId: string; response: string }[];
      }[];
    },
    @Req() req: Request,
  ) {
    const learnerId = getAuthUser(req).id;
    const results = [];
    for (const offline of body.attempts ?? []) {
      const existing = await this.attempts.findByIdempotencyKey(offline.idempotencyKey);
      if (existing) {
        results.push({ idempotencyKey: offline.idempotencyKey, status: 'ALREADY_SYNCED' });
        continue;
      }
      const subject = await this.attempts.getSubject(offline.subjectId);
      if (!subject) {
        results.push({ idempotencyKey: offline.idempotencyKey, status: 'REJECTED' });
        continue;
      }
      const attempt = await this.attempts.createOfflineAttempt({
        learnerId,
        subjectId: offline.subjectId,
        mode: offline.mode,
        idempotencyKey: offline.idempotencyKey,
        totalQuestions: offline.answers.length,
      });
      const submitted = await this.attempts.submitAttempt(attempt.id, learnerId, offline.answers);
      results.push({
        idempotencyKey: offline.idempotencyKey,
        status: 'SYNCED',
        scorePct: submitted.scorePct,
      });
    }
    return ok(results);
  }

  @Get(':id/review')
  @UseGuards(JwtAuthGuard)
  async review(@Param('id') id: string, @Req() req: Request) {
    return ok(await this.attempts.getReview(id, getAuthUser(req).id));
  }
}
