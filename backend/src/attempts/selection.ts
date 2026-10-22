import type { Prisma } from '@examspring/db';

type QuestionWithVersion = {
  id: string;
  difficulty: number;
  currentVersion: { id: string; body: string; options: Prisma.JsonValue } | null;
};

export type ServedQuestion = {
  id: string;
  versionId: string;
  body: string;
  options: Prisma.JsonValue;
  difficulty: number;
};

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = copy[i];
    const b = copy[j];
    if (a === undefined || b === undefined) continue;
    copy[i] = b;
    copy[j] = a;
  }
  return copy;
}

/** Learner-facing view of a question: never includes the answer key or explanation. */
export function toServed(questions: QuestionWithVersion[]): ServedQuestion[] {
  const served: ServedQuestion[] = [];
  for (const q of questions) {
    if (!q.currentVersion) continue;
    served.push({
      id: q.id,
      versionId: q.currentVersion.id,
      body: q.currentVersion.body,
      options: q.currentVersion.options,
      difficulty: q.difficulty,
    });
  }
  return served;
}

export const APPROVED_WITH_VERSION = {
  status: 'APPROVED',
  deletedAt: null,
  currentVersionId: { not: null },
} as const;

export const SERVED_VERSION_SELECT = {
  currentVersion: { select: { id: true, body: true, options: true } },
} as const;
