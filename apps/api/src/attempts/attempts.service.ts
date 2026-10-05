import { Inject, Injectable } from '@nestjs/common';
import type { PrismaClient } from '@examspring/db';

import { PRISMA } from '../database/database.module';

@Injectable()
export class AttemptsService {
  constructor(@Inject(PRISMA) private readonly prisma: PrismaClient) {}

  async startDiagnostic(
    learnerId: string,
    subjectId: string,
  ): Promise<{ attemptId: string; questions: unknown[] }> {
    const approved = await this.prisma.question.findMany({
      where: { subjectId, status: 'APPROVED', deletedAt: null },
      include: { currentVersion: true },
      take: 200,
    });
    const picked = shuffle(approved).slice(0, 15);
    const subject = await this.prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) throw new Error('Subject not found');
    const attempt = await this.prisma.attempt.create({
      data: {
        learnerId,
        examId: subject.examId,
        subjectId,
        mode: 'DIAGNOSTIC',
        totalQuestions: picked.length,
        idempotencyKey: `diag-${learnerId}-${Date.now()}`,
      },
    });
    return {
      attemptId: attempt.id,
      questions: picked.map((q) => ({
        id: q.id,
        versionId: q.currentVersion?.id,
        body: q.currentVersion?.body,
        options: q.currentVersion?.options,
        difficulty: q.difficulty,
      })),
    };
  }

  async submitAttempt(
    attemptId: string,
    learnerId: string,
    answers: { questionVersionId: string; response: string }[],
  ) {
    const attempt = await this.prisma.attempt.findUnique({ where: { id: attemptId } });
    if (!attempt || attempt.learnerId !== learnerId) throw new Error('Attempt not found');
    if (attempt.submittedAt) return attempt;
    let correct = 0;
    for (const a of answers) {
      const version = await this.prisma.questionVersion.findUnique({
        where: { id: a.questionVersionId },
      });
      if (!version) continue;
      const isCorrect = version.answerKey === a.response;
      if (isCorrect) correct += 1;
      const item = await this.prisma.attemptItem.create({
        data: {
          attemptId,
          questionId: version.questionId,
          questionVersionId: version.id,
          response: a.response,
          isCorrect,
          answeredAt: new Date(),
        },
      });
      await this.recordMastery(
        learnerId,
        version.questionId,
        isCorrect,
        item.id,
        attempt.mode === 'DIAGNOSTIC',
      );
    }
    const scorePct = attempt.totalQuestions > 0 ? (correct / attempt.totalQuestions) * 100 : 0;
    return this.prisma.attempt.update({
      where: { id: attemptId },
      data: { submittedAt: new Date(), correctCount: correct, scorePct },
    });
  }

  private async recordMastery(
    learnerId: string,
    questionId: string,
    isCorrect: boolean,
    itemId: string,
    isDiagnostic: boolean,
  ) {
    const links = await this.prisma.questionObjective.findMany({ where: { questionId } });
    for (const link of links) {
      const existing = await this.prisma.masteryScore.findUnique({
        where: { learnerId_objectiveId: { learnerId, objectiveId: link.objectiveId } },
      });
      const prior = existing ? Number(existing.score) : 0.5;
      const next = clamp(prior * 0.5 + (isCorrect ? 1 : 0) * 0.5, 0, 1);
      await this.prisma.masteryScore.upsert({
        where: { learnerId_objectiveId: { learnerId, objectiveId: link.objectiveId } },
        update: { score: next, attemptsCount: { increment: 1 }, lastPracticedAt: new Date() },
        create: {
          learnerId,
          objectiveId: link.objectiveId,
          score: next,
          confidence: 0.2,
          attemptsCount: 1,
          lastPracticedAt: new Date(),
        },
      });
      await this.prisma.masteryEvent.create({
        data: {
          learnerId,
          objectiveId: link.objectiveId,
          eventType: isDiagnostic ? 'DIAGNOSTIC' : 'ATTEMPT',
          delta: next - prior,
          sourceAttemptItemId: itemId,
        },
      });
    }
  }

  async findByIdempotencyKey(key: string) {
    return this.prisma.attempt.findUnique({ where: { idempotencyKey: key } });
  }

  async getSubject(subjectId: string) {
    return this.prisma.subject.findUnique({ where: { id: subjectId } });
  }

  async createOfflineAttempt(input: {
    learnerId: string;
    subjectId: string;
    mode: 'PRACTICE' | 'DIAGNOSTIC' | 'CBT';
    idempotencyKey: string;
    totalQuestions: number;
  }) {
    const subject = await this.prisma.subject.findUnique({ where: { id: input.subjectId } });
    if (!subject) throw new Error('Subject not found');
    return this.prisma.attempt.create({
      data: {
        learnerId: input.learnerId,
        examId: subject.examId,
        subjectId: input.subjectId,
        mode: input.mode,
        totalQuestions: input.totalQuestions,
        idempotencyKey: input.idempotencyKey,
        syncedFromOffline: true,
      },
    });
  }

  async getMastery(learnerId: string) {
    return this.prisma.masteryScore.findMany({ where: { learnerId } });
  }

  async getReview(attemptId: string, learnerId: string) {
    const attempt = await this.prisma.attempt.findUnique({
      where: { id: attemptId },
      include: { items: true },
    });
    if (!attempt || attempt.learnerId !== learnerId) throw new Error('Attempt not found');
    const items = await Promise.all(
      attempt.items.map(async (item) => {
        const version = await this.prisma.questionVersion.findUnique({
          where: { id: item.questionVersionId },
        });
        return {
          questionId: item.questionId,
          response: item.response,
          isCorrect: item.isCorrect,
          answerKey: version?.answerKey,
          explanation: version?.explanation,
          body: version?.body,
        };
      }),
    );
    return { attempt, items };
  }
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
