'use client';

import { useCallback, useEffect, useState } from 'react';

import { Button, Empty, ErrorText, Field, inputClass, Loading } from '@/components/ui';
import { api, errorMessage } from '@/lib/api/client';
import { useAction } from '@/lib/use-action';

type Summary = {
  cohort: { id: string; name: string; joinCode: string };
  members: { learnerId: string; fullName: string; averageMastery: number }[];
  objectives: { id: string; code: string; description: string }[];
  cells: { learnerId: string; objectiveId: string; score: number }[];
  assignments: {
    id: string;
    title: string;
    completedCount: number;
    memberCount: number;
    averageMastery: number;
  }[];
};
type Objective = { id: string; code: string; description: string };

const pct = (n: number) => `${Math.round(n * 100)}%`;

function cellClass(score: number | undefined): string {
  if (score === undefined) return 'bg-gray-50 text-gray-400';
  if (score >= 0.7) return 'bg-green-200';
  if (score >= 0.4) return 'bg-amber-200';
  return 'bg-red-200';
}

function Heatmap({ summary }: { summary: Summary }) {
  const score = (l: string, o: string) =>
    summary.cells.find((c) => c.learnerId === l && c.objectiveId === o)?.score;
  if (summary.members.length === 0)
    return <Empty>No learners yet. Share the class code: {summary.cohort.joinCode}</Empty>;
  return (
    <div className="overflow-x-auto">
      <table className="text-xs">
        <caption className="mb-1 text-left text-sm font-medium">
          Mastery by learner and objective
        </caption>
        <thead>
          <tr>
            <th scope="col" className="p-1 text-left">
              Learner
            </th>
            {summary.objectives.map((o) => (
              <th key={o.id} scope="col" title={o.description} className="p-1">
                {o.code}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {summary.members.map((m) => (
            <tr key={m.learnerId}>
              <th scope="row" className="whitespace-nowrap p-1 text-left font-normal">
                {m.fullName} ({pct(m.averageMastery)})
              </th>
              {summary.objectives.map((o) => {
                const s = score(m.learnerId, o.id);
                return (
                  <td key={o.id} className={`p-1 text-center ${cellClass(s)}`}>
                    {s === undefined ? '–' : pct(s)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AssignForm({
  cohortId,
  examId,
  onAssigned,
}: {
  cohortId: string;
  examId: string;
  onAssigned: () => void;
}) {
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [title, setTitle] = useState('');
  const [objectiveId, setObjectiveId] = useState('');
  const { busy, error, run } = useAction();

  useEffect(() => {
    api<Objective[]>(`/objectives?examId=${examId}`)
      .then(setObjectives)
      .catch(() => setObjectives([]));
  }, [examId]);

  const assign = () =>
    run(async () => {
      await api(`/teacher/cohorts/${cohortId}/assignments`, {
        method: 'POST',
        body: { title, objectiveIds: [objectiveId] },
      });
      setTitle('');
      onAssigned();
    }, 'Could not create the assignment');

  return (
    <div className="flex flex-col gap-2 rounded border p-3">
      <h3 className="font-medium">Assign an objective</h3>
      <Field label="Title">
        <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
      </Field>
      <Field label="Objective">
        <select
          value={objectiveId}
          onChange={(e) => setObjectiveId(e.target.value)}
          className={inputClass}
        >
          <option value="">Choose an objective</option>
          {objectives.map((o) => (
            <option key={o.id} value={o.id}>
              {o.code} · {o.description}
            </option>
          ))}
        </select>
      </Field>
      <Button onClick={() => void assign()} busy={busy} disabled={!title || !objectiveId}>
        Assign
      </Button>
      <ErrorText message={error} />
    </div>
  );
}

export function CohortView({ cohortId, examId }: { cohortId: string; examId: string }) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    api<Summary>(`/teacher/cohorts/${cohortId}/summary`)
      .then(setSummary)
      .catch((e: unknown) => setError(errorMessage(e, 'Could not load the class')));
  }, [cohortId]);

  useEffect(load, [load]);

  if (error) return <ErrorText message={error} />;
  if (!summary) return <Loading />;
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">
        {summary.cohort.name} · code <span className="font-mono">{summary.cohort.joinCode}</span>
      </h2>
      <Heatmap summary={summary} />
      <h3 className="font-medium">Assignments</h3>
      {summary.assignments.length === 0 ? (
        <Empty>No assignments yet.</Empty>
      ) : (
        <ul className="flex flex-col gap-2">
          {summary.assignments.map((a) => (
            <li key={a.id} className="rounded border p-3 text-sm">
              <span className="font-medium">{a.title}</span> · {a.completedCount} of {a.memberCount}{' '}
              practised · average {pct(a.averageMastery)}
            </li>
          ))}
        </ul>
      )}
      <AssignForm cohortId={cohortId} examId={examId} onAssigned={load} />
    </section>
  );
}
