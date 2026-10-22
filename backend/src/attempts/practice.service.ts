import { Inject, Injectable } from '@nestjs/common';

import type { PrismaClient } from '@examspring/db';

import { PRISMA } from '../database/database.module';
import { AttemptsService } from './attempts.service';
import { APPROVED_WITH_VERSION, SERVED_VERSION_SELECT, shuffle, toServed } from './selection';

const CBT_SIZE = 20;
const CBT_DURATION_MS = 25 * 60 * 1000;
const PRACTICE_SIZE = 10;
const COOLDOWN_HOURS = 24;

@Injectable()
export class PracticeService {
  constructor(
    @Inject(PRISMA) private readonly prisma: PrismaClient,
    @Inject(AttemptsService) private readonly attempts: AttemptsService,
  ) {}

  /** Deterministic: weakest, most exam-weighted objective not practised in the last 24h. */
  async recommendedObjective(learnerId: string, subjectId: string) {
    const objectives = await this.prisma.objective.findMany({
      where: { subjectId },
      orderBy: { orderIndex: 'asc' },
      select: { id: true, description: true, examWeight: true },
    });
    const scores = await this.prisma.masteryScore.findMany({
      where: { learnerId, objectiveId: { in: objectives.map((o) => o.id) } },
      select: { objectiveId: true, score: true, lastPracticedAt: true },
    });
    const byObjective = new Map(scores.map((s) => [s.objectiveId, s]));
    const now = Date.now();
    let best: { objective: (typeof objectives)[number]; weight: number } | null = null;
    for (const objective of objectives) {
      const s = byObjective.get(objective.id);
      const last = s?.lastPracticedAt?.getTime();
      if (last !== undefined && (now - last) / 3_600_000 < COOLDOWN_HOURS) continue;
      const mastery = s ? Number(s.score) : 0.5;
      const weight = (1 - mastery) * Number(objective.examWeight);
      if (!best || weight > best.weight) best = { objective, weight };
    }
    return best?.objective ?? null;
  }

  async startCbt(learnerId: string, subjectId: string) {
    const subject = await this.attempts.requireSubject(subjectId);
    const approved = await this.prisma.question.findMany({
      where: { subjectId, ...APPROVED_WITH_VERSION },
      select: { id: true, difficulty: true, ...SERVED_VERSION_SELECT },
      take: 200,
    });
    const questions = toServed(shuffle(approved).slice(0, CBT_SIZE));
    const opened = await this.attempts.openAttempt({ learnerId, subject, mode: 'CBT', questions });
    return { ...opened, durationMs: CBT_DURATION_MS };
  }

  async startPractice(learnerId: string, subjectId: string) {
    const subject = await this.attempts.requireSubject(subjectId);
    const objective = await this.recommendedObjective(learnerId, subjectId);
    const approved = objective
      ? await this.prisma.question.findMany({
          where: { ...APPROVED_WITH_VERSION, objectives: { some: { objectiveId: objective.id } } },
          select: { id: true, difficulty: true, ...SERVED_VERSION_SELECT },
          take: PRACTICE_SIZE,
        })
      : [];
    const questions = toServed(approved);
    const opened = await this.attempts.openAttempt({
      learnerId,
      subject,
      mode: 'PRACTICE',
      questions,
    });
    return {
      ...opened,
      objectiveId: objective?.id ?? null,
      objective: objective?.description ?? null,
    };
  }
}
