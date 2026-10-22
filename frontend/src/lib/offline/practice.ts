'use client';

import { z } from 'zod';

import { db } from './db';
import { queueOfflineAttempt } from './sync';

const PRACTICE_SIZE = 10;

const PackQuestionSchema = z.object({
  id: z.string(),
  versionId: z.string(),
  body: z.string(),
  options: z.array(z.object({ key: z.string(), text: z.string() })),
  answerKey: z.string(),
  explanation: z.string(),
});

const ManifestSchema = z.object({
  pack: z.object({ id: z.string(), subjectId: z.string(), name: z.string() }),
  questions: z.array(PackQuestionSchema),
});

export type PackQuestion = z.infer<typeof PackQuestionSchema>;

/** Downloaded pack for a subject, validated; null if none or if it predates the current format. */
export async function findOfflinePack(subjectId: string) {
  const packs = await db.contentPacks.where({ subjectId }).toArray();
  const newest = packs.sort((a, b) => b.version - a.version)[0];
  if (!newest) return null;
  const parsed = ManifestSchema.safeParse(newest.manifest);
  return parsed.success ? parsed.data : null;
}

export function pickPracticeSet(questions: PackQuestion[]): PackQuestion[] {
  const copy = [...questions];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = copy[i];
    const b = copy[j];
    if (a && b) {
      copy[i] = b;
      copy[j] = a;
    }
  }
  return copy.slice(0, PRACTICE_SIZE);
}

/** Feedback is provisional; the server re-scores the queued attempt on sync. */
export async function finishOfflinePractice(
  subjectId: string,
  questions: PackQuestion[],
  answers: Record<string, string>,
): Promise<{ correct: number; total: number }> {
  const answered = questions.flatMap((q) => {
    const response = answers[q.id];
    return response ? [{ questionVersionId: q.versionId, response }] : [];
  });
  await queueOfflineAttempt({
    idempotencyKey: crypto.randomUUID(),
    subjectId,
    mode: 'PRACTICE',
    answers: answered,
    queuedAt: Date.now(),
  });
  const correct = questions.filter((q) => answers[q.id] === q.answerKey).length;
  return { correct, total: questions.length };
}
