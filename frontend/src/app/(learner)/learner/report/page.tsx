'use client';

import { useEffect, useState } from 'react';

import { DashboardShell } from '@/components/DashboardShell';
import { Empty, ErrorText, Loading, MasteryBar } from '@/components/ui';
import { api, errorMessage } from '@/lib/api/client';

type Report = {
  attemptsCount: number;
  avgScorePct: number;
  masteryTop5: { objectiveId: string; score: number; attemptsCount: number }[];
  last7DaysAnswers: number;
};
type Objective = { id: string; description: string };

export default function LearnerReportPage() {
  const [report, setReport] = useState<Report | null>(null);
  const [names, setNames] = useState<Map<string, string>>(new Map());
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api<Report>('/reports/learner'), api<Objective[]>('/objectives')])
      .then(([r, objectives]) => {
        setReport(r);
        setNames(new Map(objectives.map((o) => [o.id, o.description])));
      })
      .catch((e: unknown) => setError(errorMessage(e, 'Could not load your report')));
  }, []);

  return (
    <DashboardShell title="My report">
      <ErrorText message={error} />
      {!report && !error && <Loading />}
      {report && (
        <>
          <dl className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded border p-3">
              <dt className="text-xs text-gray-600">Attempts</dt>
              <dd className="text-xl font-semibold">{report.attemptsCount}</dd>
            </div>
            <div className="rounded border p-3">
              <dt className="text-xs text-gray-600">Average</dt>
              <dd className="text-xl font-semibold">{Math.round(report.avgScorePct)}%</dd>
            </div>
            <div className="rounded border p-3">
              <dt className="text-xs text-gray-600">Answers this week</dt>
              <dd className="text-xl font-semibold">{report.last7DaysAnswers}</dd>
            </div>
          </dl>
          <h2 className="font-medium">Strongest topics</h2>
          {report.masteryTop5.length === 0 ? (
            <Empty>Take a diagnostic to see your topics.</Empty>
          ) : (
            report.masteryTop5.map((m) => (
              <MasteryBar
                key={m.objectiveId}
                label={names.get(m.objectiveId) ?? 'Topic'}
                score={m.score}
              />
            ))
          )}
        </>
      )}
    </DashboardShell>
  );
}
