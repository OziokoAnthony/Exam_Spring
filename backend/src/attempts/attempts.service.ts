import {
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';

import type { Prisma, PrismaClient } from '@examspring/db';

import { PRISMA } from '../database/database.module';
import { MasteryService } from '../mastery/mastery.service';
import type { GradedItem } from '../mastery/mastery.service';
import { APPROVED_WITH_VERSION, SERVED_VERSION_SELECT, shuffle, toServed } from './selection';
import type { ServedQuestion } from './selection';

const DIAGNOSTIC_SIZE = 15;

export type AnswerInput = { questionVersionId: string; response: string };
export type AttemptMode = 'DIAGNOSTIC' | 'PRACTICE' | 'CBT';

type AttemptRow = {
  id: string;
  learnerId: string;
  subjectId: string;
  mode: string;
  totalQuestions: number;
};

@Injectable()
export class AttemptsService {
  constructor(
    @Inject(PRISMA) private readonly prisma: PrismaClient,
    @Inject(MasteryService) private readonly mastery: MasteryService,
  ) {}

  async startDiagnostic(learnerId: string, subjectId: string) {
    const subject = await this.requireSubject(subjectId);
    const approved = await this.prisma.question.findMany({
      where: { subjectId, ...APPROVED_WITH_VERSION },
      select: { id: true, difficulty: true, ...SERVED_VERSION_SELECT },
      take: 200,
    });
    const questions = toServed(shuffle(approved).slice(0, DIAGNOSTIC_SIZE));
    return this.openAttempt({ learnerId, subject, mode: 'DIAGNOSTIC', questions });
  }

  /** Creates an attempt for served questions; refuses empty attempts. */
  async openAttempt(args: {
    learnerId: string;
    subject: { id: string; examId: string };
    mode: AttemptMode;
    questions: ServedQuestion[];
  }): Promise<{ attemptId: string; questions: ServedQuestion[] }> {
    if (args.questions.length === 0) {
      throw new UnprocessableEntityException('No approved questions for this subject yet');
    }
    const attempt = await this.prisma.attempt.create({
      data: {
        learnerId: args.learnerId,
        examId: args.subject.examId,
        subjectId: args.subject.id,
        mode: args.mode,
        totalQuestions: args.questions.length,
        idempotencyKey: `${args.mode.toLowerCase()}-${args.learnerId}-${Date.now()}`,
      },
    });
    return { attemptId: attempt.id, questions: args.questions };
  }

  async requireSubject(subjectId: string): Promise<{ id: string; examId: string }> {
    const subject = await this.prisma.subject.findUnique({
      where: { id: subjectId },
      select: { id: true, examId: true },
    });
    if (!subject) throw new NotFoundException('Subject not found');
    return subject;
  }

  /** Scores server-side. Idempotent: a second submit returns the first result. */
  async submitAttempt(attemptId: string, learnerId: string, answers: AnswerInput[]) {
    const attempt = await this.prisma.attempt.findUnique({ where: { id: attemptId } });
    if (!attempt || attempt.learnerId !== learnerId)
      throw new NotFoundException('Attempt not found');
    return this.prisma.$transaction(async (tx) => {
      const claimed = await tx.attempt.updateMany({
        where: { id: attemptId, submittedAt: null },
        data: { submittedAt: new Date() },
      });
      if (claimed.count === 0) return tx.attempt.findUniqueOrThrow({ where: { id: attemptId } });
      const graded = await this.grade(tx, attempt, answers);
      await this.mastery.apply(tx, learnerId, graded, attempt.mode === 'DIAGNOSTIC');
      const correct = graded.filter((g) => g.isCorrect).length;
      const scorePct = attempt.totalQuestions > 0 ? (correct / attempt.totalQuestions) * 100 : 0;
      return tx.attempt.update({
        where: { id: attemptId },
        data: { correctCount: correct, scorePct },
      });
    });
  }

  /** Only approved questions from the attempt's subject count, each at most once. */
  private async grade(
    tx: Prisma.TransactionClient,
    attempt: AttemptRow,
    answers: AnswerInput[],
  ): Promise<GradedItem[]> {
    const versions = await tx.questionVersion.findMany({
      where: {
        id: { in: answers.map((a) => a.questionVersionId) },
        question: { subjectId: attempt.subjectId, status: 'APPROVED', deletedAt: null },
      },
      select: { id: true, questionId: true, answerKey: true },
    });
    const byId = new Map(versions.map((v) => [v.id, v]));
    const seen = new Set<string>();
    const rows: Prisma.AttemptItemCreateManyInput[] = [];
    for (const answer of answers) {
      const version = byId.get(answer.questionVersionId);
      if (!version || seen.has(version.questionId)) continue;
      if (rows.length >= attempt.totalQuestions) break;
      seen.add(version.questionId);
      rows.push({
        attemptId: attempt.id,
        questionId: version.questionId,
        questionVersionId: version.id,
        response: answer.response,
        isCorrect: version.answerKey === answer.response,
        answeredAt: new Date(),
      });
    }
    const items = await tx.attemptItem.createManyAndReturn({
      data: rows,
      select: { id: true, questionId: true, isCorrect: true },
    });
    return items.map((i) => ({
      itemId: i.id,
      questionId: i.questionId,
      isCorrect: i.isCorrect === true,
    }));
  }

  async findOwnByIdempotencyKey(learnerId: string, key: string) {
    return this.prisma.attempt.findUnique({ where: { idempotencyKey: scopedKey(learnerId, key) } });
  }

  async createOfflineAttempt(input: {
    learnerId: string;
    subjectId: string;
    mode: AttemptMode;
    idempotencyKey: string;
    totalQuestions: number;
  }) {
    const subject = await this.requireSubject(input.subjectId);
    return this.prisma.attempt.create({
      data: {
        learnerId: input.learnerId,
        examId: subject.examId,
        subjectId: subject.id,
        mode: input.mode,
        totalQuestions: input.totalQuestions,
        idempotencyKey: scopedKey(input.learnerId, input.idempotencyKey),
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
    if (!attempt || attempt.learnerId !== learnerId)
      throw new NotFoundException('Attempt not found');
    if (!attempt.submittedAt) throw new UnprocessableEntityException('Attempt not submitted yet');
    const versions = await this.prisma.questionVersion.findMany({
      where: { id: { in: attempt.items.map((i) => i.questionVersionId) } },
      select: { id: true, answerKey: true, explanation: true, body: true },
    });
    const byId = new Map(versions.map((v) => [v.id, v]));
    const { items, ...summary } = attempt;
    return {
      attempt: summary,
      items: items.map((item) => {
        const version = byId.get(item.questionVersionId);
        return {
          questionId: item.questionId,
          response: item.response,
          isCorrect: item.isCorrect,
          answerKey: version?.answerKey ?? null,
          explanation: version?.explanation ?? null,
          body: version?.body ?? null,
        };
      }),
    };
  }
}

/** Client idempotency keys are scoped per learner so they cannot collide across accounts. */
function scopedKey(learnerId: string, key: string): string {
  return `offline:${learnerId}:${key}`;
}
