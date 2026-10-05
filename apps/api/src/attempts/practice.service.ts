import { Inject, Injectable } from '@nestjs/common';

import type { PrismaClient } from '@examspring/db';

import { PRISMA } from '../database/database.module';

@Injectable()
export class PracticeService {
  constructor(@Inject(PRISMA) private readonly prisma: PrismaClient) {}

  async recommendedObjective(learnerId: string, subjectId: string) {
    const objectives = await this.prisma.objective.findMany({ where: { subjectId } });
    const scores = await this.prisma.masteryScore.findMany({ where: { learnerId } });
    const byObjective = new Map(scores.map((s) => [s.objectiveId, s]));
    const now = Date.now();
    let best: { objectiveId: string; weight: number } | null = null;
    for (const objective of objectives) {
      const s = byObjective.get(objective.id);
      const mastery = s ? Number(s.score) : 0.5;
      const last = s?.lastPracticedAt ? new Date(s.lastPracticedAt).getTime() : 0;
      const hoursSince = (now - last) / 3_600_000;
      const recencyFactor = last === 0 ? 1 : Math.min(1, hoursSince / 24);
      if (last !== 0 && hoursSince < 24) continue;
      const weight = (1 - mastery) * Number(objective.examWeight) * recencyFactor;
      if (!best || weight > best.weight) best = { objectiveId: objective.id, weight };
    }
    return best ? this.prisma.objective.findUnique({ where: { id: best.objectiveId } }) : null;
  }

  async startCbt(learnerId: string, subjectId: string) {
    const questions = await this.prisma.question.findMany({
      where: { subjectId, status: 'APPROVED', deletedAt: null },
      include: { currentVersion: true },
      take: 200,
    });
    const picked = shuffle(questions).slice(0, 20);
    const subject = await this.prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) throw new Error('Subject not found');
    const attempt = await this.prisma.attempt.create({
      data: {
        learnerId,
        examId: subject.examId,
        subjectId,
        mode: 'CBT',
        totalQuestions: picked.length,
        idempotencyKey: `cbt-${learnerId}-${Date.now()}`,
      },
    });
    return {
      attemptId: attempt.id,
      durationMs: 25 * 60 * 1000,
      questions: picked.map((q) => ({
        id: q.id,
        versionId: q.currentVersion?.id,
        body: q.currentVersion?.body,
        options: q.currentVersion?.options,
        difficulty: q.difficulty,
      })),
    };
  }

  async startPractice(learnerId: string, subjectId: string) {
    const objective = await this.recommendedObjective(learnerId, subjectId);
    const links = objective
      ? await this.prisma.questionObjective.findMany({ where: { objectiveId: objective.id } })
      : [];
    const questionIds = links.map((l) => l.questionId);
    const questions = await this.prisma.question.findMany({
      where: { id: { in: questionIds }, status: 'APPROVED', deletedAt: null },
      include: { currentVersion: true },
      take: 10,
    });
    const subject = await this.prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) throw new Error('Subject not found');
    const attempt = await this.prisma.attempt.create({
      data: {
        learnerId,
        examId: subject.examId,
        subjectId,
        mode: 'PRACTICE',
        totalQuestions: questions.length,
        idempotencyKey: `practice-${learnerId}-${Date.now()}`,
      },
    });
    return {
      attemptId: attempt.id,
      objectiveId: objective?.id ?? null,
      objective: objective?.description ?? null,
      questions: questions.map((q) => ({
        id: q.id,
        versionId: q.currentVersion?.id,
        body: q.currentVersion?.body,
        options: q.currentVersion?.options,
        difficulty: q.difficulty,
      })),
    };
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
