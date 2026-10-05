'use client';

import { useEffect, useState } from 'react';

import { api } from '@/lib/api/client';

type Cohort = { id: string; name: string; joinCode: string };

export default function TeacherDashboardPage() {
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [name, setName] = useState('');
  const [examId, setExamId] = useState('');
  const [exams, setExams] = useState<{ id: string; name: string }[]>([]);
  const [joinCode, setJoinCode] = useState('');

  useEffect(() => {
    api<{ id: string; name: string }[]>('/exams')
      .then(setExams)
      .catch(() => undefined);
    api<Cohort[]>('/teacher/cohorts')
      .then(setCohorts)
      .catch(() => undefined);
  }, []);

  async function create() {
    const c = await api<Cohort>('/teacher/cohorts', {
      method: 'POST',
      body: JSON.stringify({ name, examId }),
    });
    setCohorts([...cohorts, c]);
  }

  async function join() {
    await api('/teacher/cohorts/join', { method: 'POST', body: JSON.stringify({ joinCode }) });
  }

  return (
    <main className="flex min-h-screen flex-col gap-4 p-4">
      <h1 className="text-xl font-semibold">Teacher dashboard</h1>
      <div className="flex flex-col gap-2 rounded border p-3">
        <h2 className="font-medium">Create cohort</h2>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Cohort name"
          className="rounded border p-2"
        />
        <select
          value={examId}
          onChange={(e) => setExamId(e.target.value)}
          className="rounded border p-2"
        >
          <option value="">Choose exam</option>
          {exams.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
        <button
          onClick={create}
          disabled={!name || !examId}
          className="rounded bg-black p-2 text-white disabled:opacity-50"
        >
          Create
        </button>
      </div>
      <div className="flex flex-col gap-2 rounded border p-3">
        <h2 className="font-medium">Join a cohort</h2>
        <input
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value)}
          placeholder="Join code"
          className="rounded border p-2"
        />
        <button onClick={join} className="rounded bg-black p-2 text-white">
          Join
        </button>
      </div>
      <h2 className="font-medium">Your cohorts</h2>
      {cohorts.map((c) => (
        <div key={c.id} className="rounded border p-3">
          {c.name} — code: {c.joinCode}
        </div>
      ))}
    </main>
  );
}
