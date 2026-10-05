'use client';

import { api } from '@/lib/api/client';
import { db } from './db';
import type { OfflineAttempt } from './db';

export async function queueOfflineAttempt(attempt: OfflineAttempt): Promise<void> {
  await db.offlineAttempts.put(attempt);
}

export async function syncOfflineAttempts(): Promise<{ synced: number; remaining: number }> {
  const queued = await db.offlineAttempts.toArray();
  if (queued.length === 0) return { synced: 0, remaining: 0 };
  const results = await api<{ idempotencyKey: string; status: string }[]>('/attempts/sync', {
    method: 'POST',
    body: JSON.stringify({
      attempts: queued.map((q) => ({
        idempotencyKey: q.idempotencyKey,
        subjectId: q.subjectId,
        mode: q.mode,
        answers: q.answers,
      })),
    }),
  });
  const done = new Set(
    results
      .filter((r) => r.status === 'SYNCED' || r.status === 'ALREADY_SYNCED')
      .map((r) => r.idempotencyKey),
  );
  for (const key of done) await db.offlineAttempts.delete(key);
  return { synced: done.size, remaining: queued.length - done.size };
}

export async function pendingCount(): Promise<number> {
  return db.offlineAttempts.count();
}
