'use client';

import { useEffect, useState } from 'react';

import { api } from '@/lib/api/client';

type Child = { id: string; fullName: string; emailVerifiedAt: string | null };
type Summary = {
  mastery: { objectiveId: string; score: string; attemptsCount: number }[];
  last7DaysAnswers: number;
};

export default function ParentDashboardPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [selected, setSelected] = useState('');
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    api<Child[]>('/parent/children')
      .then(setChildren)
      .catch(() => undefined);
  }, []);

  async function loadSummary(id: string) {
    setSelected(id);
    const data = await api<Summary>(`/parent/children/${id}/summary`);
    setSummary(data);
  }

  return (
    <main className="flex min-h-screen flex-col gap-4 p-4">
      <h1 className="text-xl font-semibold">Parent dashboard</h1>
      <h2 className="text-lg font-medium">Linked learners</h2>
      {children.length === 0 && <p className="text-gray-600">No linked learners yet.</p>}
      {children.map((c) => (
        <button
          key={c.id}
          onClick={() => loadSummary(c.id)}
          className={`rounded border p-3 text-left ${selected === c.id ? 'border-green-700' : ''}`}
        >
          {c.fullName}
        </button>
      ))}
      {summary && (
        <div className="rounded border p-3">
          <h3 className="font-medium">Last 7 days: {summary.last7DaysAnswers} answers</h3>
          {summary.mastery.map((m) => (
            <div key={m.objectiveId} className="mt-2">
              <div className="h-3 rounded bg-gray-200">
                <div
                  className="h-3 rounded bg-green-600"
                  style={{ width: `${Math.round(Number(m.score) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-600">
                {m.objectiveId}: {Math.round(Number(m.score) * 100)}% · {m.attemptsCount} attempts
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
