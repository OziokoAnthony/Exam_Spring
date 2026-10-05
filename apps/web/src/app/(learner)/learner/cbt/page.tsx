'use client';

import { useEffect, useRef, useState } from 'react';

import { api } from '@/lib/api/client';

type Subject = { id: string; name: string };
type Question = {
  id: string;
  versionId: string;
  body: string;
  options: { key: string; text: string }[];
};

export default function CbtPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectId, setSubjectId] = useState('');
  const [attemptId, setAttemptId] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [index, setIndex] = useState(0);
  const [remainingMs, setRemainingMs] = useState(25 * 60 * 1000);
  const [result, setResult] = useState<{
    correctCount: number;
    totalQuestions: number;
    scorePct: number;
  } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    api<Subject[]>('/subjects')
      .then(setSubjects)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (questions.length === 0 || result) return;
    timerRef.current = setInterval(() => {
      setRemainingMs((ms) => {
        if (ms <= 1000) {
          if (timerRef.current) clearInterval(timerRef.current);
          void submit();
          return 0;
        }
        return ms - 1000;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [questions.length, result]);

  async function start() {
    const res = await api<{ attemptId: string; questions: Question[] }>('/attempts/cbt', {
      method: 'POST',
      body: JSON.stringify({ subjectId }),
    });
    setAttemptId(res.attemptId);
    setQuestions(res.questions);
    setRemainingMs(25 * 60 * 1000);
  }

  async function submit() {
    if (timerRef.current) clearInterval(timerRef.current);
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
          CBT result: {Math.round(Number(result.scorePct))}%
        </h1>
        <p className="mt-2 text-gray-600">
          {result.correctCount} of {result.totalQuestions} correct
        </p>
      </main>
    );
  }

  const q = questions[index];

  return (
    <main className="flex min-h-screen flex-col gap-4 p-4">
      <h1 className="text-xl font-semibold">CBT Simulation</h1>
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
            Start CBT
          </button>
        </div>
      )}
      {q && (
        <>
          <p className="text-sm text-gray-600">
            Time left: {Math.floor(remainingMs / 60000)}:
            {String(Math.floor((remainingMs % 60000) / 1000)).padStart(2, '0')}
          </p>
          <div className="rounded border p-3">
            <p className="font-medium">
              {index + 1}. {q.body}
            </p>
            {q.options.map((o) => (
              <label key={o.key} className="flex items-center gap-2 mt-2">
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
          <div className="flex gap-2">
            <button
              onClick={() => setIndex(Math.max(0, index - 1))}
              className="rounded border px-4 py-2"
            >
              Prev
            </button>
            <button
              onClick={() => setIndex(Math.min(questions.length - 1, index + 1))}
              className="rounded border px-4 py-2"
            >
              Next
            </button>
            <button
              onClick={() => setFlagged({ ...flagged, [q.id]: !flagged[q.id] })}
              className="rounded border px-4 py-2"
            >
              {flagged[q.id] ? 'Unflag' : 'Flag'}
            </button>
            <button onClick={submit} className="rounded bg-black px-4 py-2 text-white">
              Submit
            </button>
          </div>
        </>
      )}
    </main>
  );
}
