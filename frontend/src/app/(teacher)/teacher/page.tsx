'use client';

import { useEffect, useState } from 'react';

import { DashboardShell } from '@/components/DashboardShell';
import { Button, Empty, ErrorText, Field, inputClass, Loading } from '@/components/ui';
import { api, errorMessage } from '@/lib/api/client';
import { useAction } from '@/lib/use-action';

import { CohortView } from './cohort-view';

type Cohort = { id: string; name: string; joinCode: string; examId: string };
type Exam = { id: string; name: string };

function CreateCohort({ onCreated }: { onCreated: (c: Cohort) => void }) {
  const [exams, setExams] = useState<Exam[]>([]);
  const [name, setName] = useState('');
  const [examId, setExamId] = useState('');
  const { busy, error, run } = useAction();

  useEffect(() => {
    api<Exam[]>('/exams')
      .then(setExams)
      .catch(() => setExams([]));
  }, []);

  const create = () =>
    run(async () => {
      onCreated(await api<Cohort>('/teacher/cohorts', { method: 'POST', body: { name, examId } }));
      setName('');
    }, 'Could not create the class');

  return (
    <details className="rounded border p-3">
      <summary className="cursor-pointer font-medium">Create a class</summary>
      <div className="mt-2 flex flex-col gap-2">
        <Field label="Class name">
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Exam">
          <select value={examId} onChange={(e) => setExamId(e.target.value)} className={inputClass}>
            <option value="">Choose an exam</option>
            {exams.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </Field>
        <Button onClick={() => void create()} busy={busy} disabled={!name || !examId}>
          Create class
        </Button>
        <ErrorText message={error} />
      </div>
    </details>
  );
}

export default function TeacherDashboardPage() {
  const [cohorts, setCohorts] = useState<Cohort[] | null>(null);
  const [selected, setSelected] = useState<Cohort | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api<Cohort[]>('/teacher/cohorts')
      .then((list) => {
        setCohorts(list);
        setSelected(list[0] ?? null);
      })
      .catch((e: unknown) => setError(errorMessage(e, 'Could not load your classes')));
  }, []);

  return (
    <DashboardShell title="Your classes">
      <ErrorText message={error} />
      {cohorts === null && !error && <Loading />}
      {cohorts?.length === 0 && (
        <Empty>Create a class, then share its code with your learners.</Empty>
      )}
      {cohorts && cohorts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {cohorts.map((c) => (
            <Button
              key={c.id}
              variant={selected?.id === c.id ? 'primary' : 'secondary'}
              onClick={() => setSelected(c)}
            >
              {c.name}
            </Button>
          ))}
        </div>
      )}
      {selected && <CohortView key={selected.id} cohortId={selected.id} examId={selected.examId} />}
      <CreateCohort
        onCreated={(c) => {
          setCohorts((list) => [...(list ?? []), c]);
          setSelected(c);
        }}
      />
    </DashboardShell>
  );
}
