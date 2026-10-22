'use client';

import { useEffect, useState } from 'react';

import { DashboardShell } from '@/components/DashboardShell';
import { Button, Empty, ErrorText, Loading, MasteryBar } from '@/components/ui';
import { api, errorMessage } from '@/lib/api/client';
import { useAction } from '@/lib/use-action';

type Child = { id: string; fullName: string };
type Summary = {
  mastery: { subjectId: string; subject: string; averageMastery: number; objectives: number }[];
  streakDays: number;
  last7DaysAnswers: number;
};

function ChildSummary({ child, onRevoked }: { child: Child; onRevoked: () => void }) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [confirming, setConfirming] = useState(false);
  const { busy, error, run, setError } = useAction();

  useEffect(() => {
    setSummary(null);
    api<Summary>(`/parent/children/${child.id}/summary`)
      .then(setSummary)
      .catch((e: unknown) => setError(errorMessage(e, 'Could not load progress')));
  }, [child.id, setError]);

  const revoke = () =>
    run(async () => {
      await api('/consent/revoke', { method: 'POST', body: { learnerId: child.id } });
      onRevoked();
    }, 'Could not withdraw consent');

  return (
    <section className="flex flex-col gap-3 rounded border p-4 print:border-0">
      <h2 className="text-lg font-semibold">{child.fullName}</h2>
      {!summary && !error && <Loading />}
      {summary && (
        <>
          <p>
            Study streak:{' '}
            <strong>
              {summary.streakDays} day{summary.streakDays === 1 ? '' : 's'}
            </strong>{' '}
            · Questions answered in the last 7 days: <strong>{summary.last7DaysAnswers}</strong>
          </p>
          {summary.mastery.length === 0 ? (
            <Empty>No practice yet.</Empty>
          ) : (
            summary.mastery.map((m) => (
              <MasteryBar key={m.subjectId} label={m.subject} score={m.averageMastery} />
            ))
          )}
          <p className="text-xs text-gray-600">You see progress only, never individual answers.</p>
        </>
      )}
      <div className="flex flex-wrap gap-2 print:hidden">
        <Button variant="secondary" onClick={() => window.print()} disabled={!summary}>
          Save as PDF
        </Button>
        {confirming ? (
          <>
            <Button onClick={() => void revoke()} busy={busy} className="bg-red-700">
              Yes, withdraw consent
            </Button>
            <Button variant="secondary" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
          </>
        ) : (
          <Button variant="secondary" onClick={() => setConfirming(true)}>
            Withdraw consent
          </Button>
        )}
      </div>
      {confirming && (
        <p className="text-sm print:hidden">
          Withdrawing consent suspends {child.fullName}&rsquo;s account straight away. Contact us if
          you also want their data deleted.
        </p>
      )}
      <ErrorText message={error} />
    </section>
  );
}

export default function ParentDashboardPage() {
  const [children, setChildren] = useState<Child[] | null>(null);
  const [selected, setSelected] = useState<Child | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api<Child[]>('/parent/children')
      .then((list) => {
        setChildren(list);
        setSelected(list[0] ?? null);
      })
      .catch((e: unknown) => setError(errorMessage(e, 'Could not load your children')));
  }, []);

  function onRevoked(id: string) {
    setChildren((list) => list?.filter((c) => c.id !== id) ?? null);
    setSelected(null);
  }

  return (
    <DashboardShell title="Your children">
      <ErrorText message={error} />
      {children === null && !error && <Loading />}
      {children?.length === 0 && (
        <Empty>No linked children yet. Your child invites you when they sign up.</Empty>
      )}
      {children && children.length > 1 && (
        <div className="flex flex-wrap gap-2 print:hidden">
          {children.map((c) => (
            <Button
              key={c.id}
              variant={selected?.id === c.id ? 'primary' : 'secondary'}
              onClick={() => setSelected(c)}
            >
              {c.fullName}
            </Button>
          ))}
        </div>
      )}
      {selected && (
        <ChildSummary key={selected.id} child={selected} onRevoked={() => onRevoked(selected.id)} />
      )}
    </DashboardShell>
  );
}
