'use client';

import { useEffect, useState } from 'react';

import { api } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth';

type Subject = { id: string; name: string };
type Question = {
  id: string;
  versionId: string;
  body: string;
  options: { key: string; text: string }[];
  difficulty: number;
};

export default function DiagnosticPage() {
  const user = useAuthStore((s) => s.user);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectId, setSubjectId] = useState('');
  const [attemptId, setAttemptId] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{
    correctCount: number;
    totalQuestions: number;
    scorePct: number;
  } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api<Subject[]>('/subjects')
      .then(setSubjects)
      .catch(() => setError('Could not load subjects'));
  }, []);

  async function start() {
    const res = await api<{ attemptId: string; questions: Question[] }>('/attempts/diagnostic', {
      method: 'POST',
      body: JSON.stringify({ subjectId }),
    });
    setAttemptId(res.attemptId);
    setQuestions(res.questions);
  }

  async function submit() {
    const payload = {
      answers: questions
        .filter((q) => answers[q.id])
        .map((q) => ({ questionVersionId: q.versionId, response: answers[q.id] as string })),
    };
    const res = await api<{ correctCount: number; totalQuestions: number; scorePct: number }>(
      `/attempts/${attemptId}/submit`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    );
    setResult(res);
  }

  if (result) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl font-semibold">
          Your score: {Math.round(Number(result.scorePct))}%
        </h1>
        <p className="mt-2 text-gray-600">
          {result.correctCount} of {result.totalQuestions} correct
        </p>
        <a href="/learner" className="mt-4 text-blue-600">
          Back to dashboard
        </a>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col gap-4 p-4">
      <h1 className="text-xl font-semibold">Diagnostic</h1>
      {!user && <p className="text-red-600">Log in first.</p>}
      {questions.length === 0 && (
        <div className="flex flex-col gap-3">
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="rounded border p-2"
          >
            <option value="">Choose a subject</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <button
            onClick={start}
            disabled={!subjectId}
            className="rounded bg-black p-3 text-white disabled:opacity-50"
          >
            Start
          </button>
        </div>
      )}
      {questions.map((q) => (
        <div key={q.id} className="flex flex-col gap-2 rounded border p-3">
          <p className="font-medium">{q.body}</p>
          {q.options.map((o) => (
            <label key={o.key} className="flex items-center gap-2">
              <input
                type="radio"
                name={q.id}
                value={o.key}
                checked={answers[q.id] === o.key}
                onChange={() => setAnswers({ ...answers, [q.id]: o.key })}
              />
              {o.key}. {o.text}
            </label>
          ))}
        </div>
      ))}
      {questions.length > 0 && (
        <button onClick={submit} className="rounded bg-black p-3 text-white">
          Submit
        </button>
      )}
      {error && <p className="text-red-600">{error}</p>}
    </main>
  );
}
