import { Injectable } from '@nestjs/common';

import type { Prisma } from '@examspring/db';

export type GradedItem = { itemId: string; questionId: string; isCorrect: boolean };

type ScoreState = { prior: number; current: number; count: number; isNew: boolean };

const DEFAULT_SCORE = 0.5;
const LEARNING_RATE = 0.5;

/** Deterministic mastery update: exponential moving average per objective. */
export function nextScore(prior: number, isCorrect: boolean): number {
  const target = isCorrect ? 1 : 0;
  return Math.min(1, Math.max(0, prior * (1 - LEARNING_RATE) + target * LEARNING_RATE));
}

@Injectable()
export class MasteryService {
  /** Applies graded items inside the caller's transaction. Events are append-only. */
  async apply(
    tx: Prisma.TransactionClient,
    learnerId: string,
    items: GradedItem[],
    isDiagnostic: boolean,
  ): Promise<void> {
    if (items.length === 0) return;
    const links = await tx.questionObjective.findMany({
      where: { questionId: { in: items.map((i) => i.questionId) } },
      select: { questionId: true, objectiveId: true },
    });
    const objectiveIds = [...new Set(links.map((l) => l.objectiveId))];
    const existing = await tx.masteryScore.findMany({
      where: { learnerId, objectiveId: { in: objectiveIds } },
      select: { objectiveId: true, score: true },
    });
    const state = new Map<string, ScoreState>();
    for (const id of objectiveIds) {
      const found = existing.find((e) => e.objectiveId === id);
      const prior = found ? Number(found.score) : DEFAULT_SCORE;
      state.set(id, { prior, current: prior, count: 0, isNew: !found });
    }
    const events: Prisma.MasteryEventCreateManyInput[] = [];
    for (const item of items) {
      for (const link of links.filter((l) => l.questionId === item.questionId)) {
        const s = state.get(link.objectiveId);
        if (!s) continue;
        const next = nextScore(s.current, item.isCorrect);
        events.push({
          learnerId,
          objectiveId: link.objectiveId,
          eventType: isDiagnostic ? 'DIAGNOSTIC' : 'ATTEMPT',
          delta: next - s.current,
          sourceAttemptItemId: item.itemId,
        });
        s.current = next;
        s.count += 1;
      }
    }
    await tx.masteryEvent.createMany({ data: events });
    await this.writeScores(tx, learnerId, state);
  }

  private async writeScores(
    tx: Prisma.TransactionClient,
    learnerId: string,
    state: Map<string, ScoreState>,
  ): Promise<void> {
    const now = new Date();
    for (const [objectiveId, s] of state) {
      if (s.count === 0) continue;
      await tx.masteryScore.upsert({
        where: { learnerId_objectiveId: { learnerId, objectiveId } },
        update: { score: s.current, attemptsCount: { increment: s.count }, lastPracticedAt: now },
        create: {
          learnerId,
          objectiveId,
          score: s.current,
          confidence: 0.2,
          attemptsCount: s.count,
          lastPracticedAt: now,
        },
      });
    }
  }
}
