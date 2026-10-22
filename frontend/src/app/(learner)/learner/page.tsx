'use client';

import Link from 'next/link';
import { useState } from 'react';

import { DashboardShell } from '@/components/DashboardShell';
import { Button, ErrorText, Field, inputClass } from '@/components/ui';
import { api, errorMessage } from '@/lib/api/client';

const ACTIONS = [
  {
    href: '/learner/diagnostic',
    title: 'Take a diagnostic',
    text: '15 questions to find your strong and weak topics.',
  },
  {
    href: '/learner/practice',
    title: 'Practise',
    text: '10 questions on the topic that will help you most next.',
  },
  {
    href: '/learner/cbt',
    title: 'CBT simulation',
    text: '20 questions in 25 minutes, like the real exam.',
  },
  {
    href: '/learner/packs',
    title: 'Offline packs',
    text: 'Download questions to practise without data.',
  },
];

function JoinClass() {
  const [joinCode, setJoinCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState('');

  async function join() {
    setBusy(true);
    setError('');
    try {
      await api('/teacher/cohorts/join', { method: 'POST', body: { joinCode: joinCode.trim() } });
      setJoined(true);
    } catch (e) {
      setError(errorMessage(e, 'Could not join that class'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="flex flex-col gap-2 rounded border p-3">
      <h2 className="font-medium">Join your teacher&rsquo;s class</h2>
      <Field label="Class code">
        <input
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value)}
          className={inputClass}
        />
      </Field>
      <Button onClick={join} busy={busy} disabled={joinCode.trim().length < 4}>
        Join class
      </Button>
      {joined && (
        <p role="status" className="text-sm text-green-800">
          You have joined the class.
        </p>
      )}
      <ErrorText message={error} />
    </section>
  );
}

export default function LearnerDashboard() {
  return (
    <DashboardShell title="Your study plan">
      <ul className="grid gap-3 sm:grid-cols-2">
        {ACTIONS.map((a) => (
          <li key={a.href}>
            <Link href={a.href} className="block rounded border p-4 hover:bg-gray-50">
              <span className="font-medium">{a.title}</span>
              <span className="mt-1 block text-sm text-gray-600">{a.text}</span>
            </Link>
          </li>
        ))}
      </ul>
      <JoinClass />
    </DashboardShell>
  );
}
