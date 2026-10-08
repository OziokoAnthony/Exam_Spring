'use client';

import { useEffect, useState } from 'react';

import DashboardShell from '@/components/DashboardShell';
import { api } from '@/lib/api/client';

type Report = {
  attemptsCount: number;
  avgScorePct: number | null;
  mastery: { objectiveId: string; score: string | number; attemptsCount: number }[];
  last7DaysAnswers: number;
};

export default function LearnerReportPage() {
  const [report, setReport] = useState<Report | null>(null);

  useEffect(() => {
    api<Report>('/reports/learner')
      .then(setReport)
      .catch(() => undefined);
  }, []);

  return (
    <>
      <DashboardShell title="My report" />
      <section className="flex flex-col gap-3 px-4 pb-8">
        {!report && <p className="text-gray-600">Loading…</p>}
        {report && (
          <>
            <p>Total attempts: {report.attemptsCount}</p>
            <p>
              Average score:{' '}
              {report.avgScorePct == null ? '—' : `${Math.round(Number(report.avgScorePct))}%`}
            </p>
            <p>Answers in last 7 days: {report.last7DaysAnswers}</p>
            <h2 className="font-medium">Top objectives</h2>
            {report.mastery.map((m) => (
              <div key={m.objectiveId} className="rounded border p-2 text-sm">
                {m.objectiveId}: {Math.round(Number(m.score) * 100)}% · {m.attemptsCount} attempts
              </div>
            ))}
          </>
        )}
      </section>
    </>
  );
}
