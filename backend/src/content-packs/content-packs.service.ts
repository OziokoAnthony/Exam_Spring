import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { z } from 'zod';

import type { PrismaClient } from '@examspring/db';

import { PRISMA } from '../database/database.module';

export const CreateContentPackSchema = z.object({
  subjectId: z.string().uuid(),
  name: z.string().min(1),
  version: z.number().int().min(1),
});

export type CreateContentPack = z.infer<typeof CreateContentPackSchema>;

@Injectable()
export class ContentPacksService {
  constructor(@Inject(PRISMA) private readonly prisma: PrismaClient) {}

  async list(subjectId?: string) {
    return this.prisma.contentPack.findMany({
      where: {
        status: 'PUBLISHED',
        ...(subjectId ? { subjectId } : {}),
      },
      orderBy: { publishedAt: 'desc' },
      select: {
        id: true,
        subjectId: true,
        version: true,
        name: true,
        sizeBytes: true,
        questionCount: true,
        publishedAt: true,
      },
    });
  }

  async getManifest(id: string) {
    const pack = await this.prisma.contentPack.findUnique({ where: { id } });
    if (!pack || pack.status !== 'PUBLISHED') {
      throw new NotFoundException('Content pack not found');
    }
    const objectives = await this.prisma.objective.findMany({
      where: { subjectId: pack.subjectId },
      orderBy: { orderIndex: 'asc' },
      select: { id: true, code: true, description: true, orderIndex: true, examWeight: true },
    });
    const questions = await this.prisma.question.findMany({
      where: { subjectId: pack.subjectId, status: 'APPROVED', deletedAt: null },
      include: { currentVersion: true },
      take: 1000,
    });
    return {
      pack: {
        id: pack.id,
        subjectId: pack.subjectId,
        version: pack.version,
        name: pack.name,
        publishedAt: pack.publishedAt,
        questionCount: pack.questionCount,
        sizeBytes: pack.sizeBytes,
      },
      objectives,
      questions: questions.map((q) => ({
        id: q.id,
        type: q.type,
        difficulty: q.difficulty,
        body: q.currentVersion?.body ?? null,
        options: q.currentVersion?.options ?? [],
        answerKey: q.currentVersion?.answerKey ?? null,
      })),
    };
  }

  async create(dto: CreateContentPack) {
    return this.prisma.contentPack.create({
      data: {
        subjectId: dto.subjectId,
        name: dto.name,
        version: dto.version,
        status: 'DRAFT',
      },
    });
  }

  async publish(id: string) {
    const pack = await this.prisma.contentPack.findUnique({ where: { id } });
    if (!pack) throw new NotFoundException('Content pack not found');
    const questionCount = await this.prisma.question.count({
      where: { subjectId: pack.subjectId, status: 'APPROVED', deletedAt: null },
    });
    const sample = await this.prisma.question.findMany({
      where: { subjectId: pack.subjectId, status: 'APPROVED', deletedAt: null },
      include: { currentVersion: { select: { body: true, options: true, answerKey: true } } },
      take: 1000,
    });
    const sizeBytes = Buffer.byteLength(
      JSON.stringify(sample.map((q) => q.currentVersion)),
      'utf8',
    );
    return this.prisma.contentPack.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
        questionCount,
        storageKey: `packs/${id}.json`,
        sizeBytes,
      },
    });
  }
}
