import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { z } from 'zod';

import { AttemptsService } from './attempts.service';
import { PracticeService } from './practice.service';
import { getAuthUser, JwtAuthGuard } from '../common/jwt-auth.guard';
import { ok } from '../common/envelope';
import { ZodPipe } from '../common/zod.pipe';

const StartSchema = z.object({ subjectId: z.string().uuid() });
const AnswerSchema = z.object({
  questionVersionId: z.string().uuid(),
  response: z.enum(['A', 'B', 'C', 'D']),
});
const SubmitSchema = z.object({ answers: z.array(AnswerSchema).max(100) });
const SyncSchema = z.object({
  attempts: z
    .array(
      z.object({
        idempotencyKey: z.string().min(8).max(100),
        subjectId: z.string().uuid(),
        mode: z.enum(['PRACTICE', 'DIAGNOSTIC', 'CBT']),
        answers: z.array(AnswerSchema).min(1).max(100),
      }),
    )
    .max(50),
});

type SyncResult = {
  idempotencyKey: string;
  status: 'SYNCED' | 'ALREADY_SYNCED';
  scorePct: unknown;
};

@Controller('attempts')
@UseGuards(JwtAuthGuard)
export class AttemptsController {
  constructor(
    @Inject(AttemptsService) private readonly attempts: AttemptsService,
    @Inject(PracticeService) private readonly practice: PracticeService,
  ) {}

  @Post('diagnostic')
  async start(
    @Body(new ZodPipe(StartSchema)) dto: z.infer<typeof StartSchema>,
    @Req() req: Request,
  ) {
    return ok(await this.attempts.startDiagnostic(getAuthUser(req).id, dto.subjectId));
  }

  @Post(':id/submit')
  async submit(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodPipe(SubmitSchema)) dto: z.infer<typeof SubmitSchema>,
    @Req() req: Request,
  ) {
    return ok(await this.attempts.submitAttempt(id, getAuthUser(req).id, dto.answers));
  }

  @Get('mastery')
  async mastery(@Req() req: Request) {
    return ok(await this.attempts.getMastery(getAuthUser(req).id));
  }

  @Post('cbt')
  async startCbt(
    @Body(new ZodPipe(StartSchema)) dto: z.infer<typeof StartSchema>,
    @Req() req: Request,
  ) {
    return ok(await this.practice.startCbt(getAuthUser(req).id, dto.subjectId));
  }

  @Post('practice')
  async startPractice(
    @Body(new ZodPipe(StartSchema)) dto: z.infer<typeof StartSchema>,
    @Req() req: Request,
  ) {
    return ok(await this.practice.startPractice(getAuthUser(req).id, dto.subjectId));
  }

  /** Offline attempts are re-scored on the server; the client's score is never trusted. */
  @Post('sync')
  async syncOffline(
    @Body(new ZodPipe(SyncSchema)) body: z.infer<typeof SyncSchema>,
    @Req() req: Request,
  ) {
    const learnerId = getAuthUser(req).id;
    const results: SyncResult[] = [];
    for (const offline of body.attempts) {
      const existing = await this.attempts.findOwnByIdempotencyKey(
        learnerId,
        offline.idempotencyKey,
      );
      if (existing) {
        results.push({
          idempotencyKey: offline.idempotencyKey,
          status: 'ALREADY_SYNCED',
          scorePct: existing.scorePct,
        });
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
  async review(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request) {
    return ok(await this.attempts.getReview(id, getAuthUser(req).id));
  }
}
