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

class ExamSpringDb extends Dexie {
  offlineAttempts!: Table<OfflineAttempt, string>;

  constructor() {
    super('examspring');
    this.version(1).stores({ offlineAttempts: 'idempotencyKey' });
  }
}

export const db = new ExamSpringDb();
