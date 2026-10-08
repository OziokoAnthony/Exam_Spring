'use client';

import Dexie from 'dexie';
import type { Table } from 'dexie';

export type OfflineAttempt = {
  idempotencyKey: string;
  subjectId: string;
  mode: 'PRACTICE' | 'DIAGNOSTIC' | 'CBT';
  answers: { questionVersionId: string; response: string }[];
  queuedAt: number;
};

export type OfflinePack = {
  id: string;
  subjectId: string;
  version: number;
  name: string;
  downloadedAt: number;
  manifest: unknown;
};

class ExamSpringDb extends Dexie {
  offlineAttempts!: Table<OfflineAttempt, string>;
  contentPacks!: Table<OfflinePack, string>;

  constructor() {
    super('examspring');
    this.version(1).stores({ offlineAttempts: 'idempotencyKey' });
    this.version(2).stores({ offlineAttempts: 'idempotencyKey', contentPacks: 'id' });
  }
}

export const db = new ExamSpringDb();
