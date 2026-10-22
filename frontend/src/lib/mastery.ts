'use client';

import { useCallback, useEffect, useState } from 'react';

import { api, errorMessage } from '@/lib/api/client';

type MasteryRow = { objectiveId: string; score: string | number; attemptsCount: number };
type Objective = { id: string; description: string };

export type NamedMastery = {
  objectiveId: string;
  label: string;
  score: number;
  attemptsCount: number;
};

const STRONG = 0.7;
const WEAK = 0.4;

/** Learner's mastery for one subject, with objective names, sorted weakest first. */
export function useMastery(subjectId: string) {
  const [rows, setRows] = useState<NamedMastery[]>([]);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!subjectId) return;
    try {
      const [scores, objectives] = await Promise.all([
        api<MasteryRow[]>('/attempts/mastery'),
        api<Objective[]>(`/objectives?subjectId=${subjectId}`),
      ]);
      const names = new Map(objectives.map((o) => [o.id, o.description]));
      setRows(
        scores
          .filter((s) => names.has(s.objectiveId))
          .map((s) => ({
            objectiveId: s.objectiveId,
            label: names.get(s.objectiveId) ?? 'Objective',
            score: Number(s.score),
            attemptsCount: s.attemptsCount,
          }))
          .sort((a, b) => a.score - b.score),
      );
    } catch (e) {
      setError(errorMessage(e, 'Could not load mastery'));
    }
  }, [subjectId]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    rows,
    strong: rows.filter((r) => r.score >= STRONG),
    weak: rows.filter((r) => r.score < WEAK),
    error,
    reload: load,
  };
}
