import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { z } from 'zod';

import type { PrismaClient } from '@examspring/db';

import { PRISMA } from '../database/database.module';

const OptionSchema = z.object({ key: z.string(), text: z.string() });

export const CreateQuestionSchema = z.object({
  subjectId: z.string().uuid(),
  difficulty: z.number().int().min(1).max(5),
  body: z.string().min(1),
  options: z.array(OptionSchema).length(4),
  answerKey: z.enum(['A', 'B', 'C', 'D']),
  explanation: z.string().min(1),
  objectiveIds: z.array(z.string().uuid()).min(1),
  provenance: z.object({
    source: z.string(),
    license: z.string(),
    original_ref: z.string().optional(),
    exam_year: z.number().optional(),
  }),
});

export const NewVersionSchema = CreateQuestionSchema.omit({ subjectId: true, objectiveIds: true })
  .partial()
  .extend({
    body: z.string().min(1),
    options: z.array(OptionSchema).length(4),
    answerKey: z.enum(['A', 'B', 'C', 'D']),
    explanation: z.string().min(1),
  });

export type CreateQuestion = z.infer<typeof CreateQuestionSchema>;

@Injectable()
export class QuestionsService {
  constructor(@Inject(PRISMA) private readonly prisma: PrismaClient) {}

  async list(status?: string, subjectId?: string) {
    return this.prisma.question.findMany({
      where: {
        deletedAt: null,
        ...(status === 'DRAFT' ||
        status === 'PENDING_REVIEW' ||
        status === 'APPROVED' ||
        status === 'REJECTED' ||
        status === 'RETIRED'
          ? { status }
          : {}),
        ...(subjectId ? { subjectId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { currentVersion: { select: { id: true, body: true } } },
    });
  }

  async create(dto: CreateQuestion, authorId: string) {
    const question = await this.prisma.question.create({
      data: {
        subjectId: dto.subjectId,
        difficulty: dto.difficulty,
        versions: {
          create: {
            version: 1,
            body: dto.body,
            options: dto.options,
            answerKey: dto.answerKey,
            explanation: dto.explanation,
            authoredBy: authorId,
            provenance: dto.provenance,
          },
        },
        objectives: {
          create: dto.objectiveIds.map((objectiveId, i) => ({ objectiveId, primary: i === 0 })),
        },
      },
      include: { versions: true, objectives: true },
    });
    const v = question.versions[0];
    if (v) {
      await this.prisma.question.update({
        where: { id: question.id },
        data: { currentVersionId: v.id },
      });
    }
    return question;
  }

  async createVersion(questionId: string, dto: CreateQuestion, authorId: string) {
    const latest = await this.prisma.questionVersion.findFirst({
      where: { questionId },
      orderBy: { version: 'desc' },
    });
    const nextVersion = (latest?.version ?? 0) + 1;
    const v = await this.prisma.questionVersion.create({
      data: {
        questionId,
        version: nextVersion,
        body: dto.body,
        options: dto.options,
        answerKey: dto.answerKey,
        explanation: dto.explanation,
        authoredBy: authorId,
        provenance: dto.provenance,
      },
    });
    await this.prisma.question.update({
      where: { id: questionId },
      data: { currentVersionId: v.id, status: 'DRAFT' },
    });
    return v;
  }

  async setStatus(questionId: string, status: 'APPROVED' | 'REJECTED', adminId: string) {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      include: { versions: true },
    });
    if (!question) throw new UnauthorizedException('Question not found');
    if (status === 'APPROVED') {
      const current = question.versions.find((v) => v.id === question.currentVersionId);
      if (current) {
        await this.prisma.questionVersion.update({
          where: { id: current.id },
          data: { approvedBy: adminId, approvedAt: new Date() },
        });
      }
    }
    return this.prisma.question.update({ where: { id: questionId }, data: { status } });
  }
}
