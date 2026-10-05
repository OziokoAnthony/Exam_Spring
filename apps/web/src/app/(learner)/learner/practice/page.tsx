'use client';

import { useEffect, useState } from 'react';

import { api } from '@/lib/api/client';

type Subject = { id: string; name: string };
type Question = {
  id: string;
  versionId: string;
  body: string;
  options: { key: string; text: string }[];
  difficulty: number;
};
type ReviewItem = {
  questionId: string;
  response: string;
  isCorrect: boolean;
  answerKey: string;
  explanation: string;
  body: string;
};

export default function PracticePage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectId, setSubjectId] = useState('');
  const [objective, setObjective] = useState<string | null>(null);
  const [attemptId, setAttemptId] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [items, setItems] = useState<ReviewItem[] | null>(null);

  useEffect(() => {
    api<Subject[]>('/subjects')
      .then(setSubjects)
      .catch(() => undefined);
  }, []);

  async function start() {
    const res = await api<{ attemptId: string; objective: string | null; questions: Question[] }>(
      '/attempts/practice',
      {
        method: 'POST',
        body: JSON.stringify({ subjectId }),
      },
    );
    setAttemptId(res.attemptId);
    setObjective(res.objective);
    setQuestions(res.questions);
  }

  async function submit() {
    const payload = {
      answers: questions
        .filter((q) => answers[q.id])
        .map((q) => ({ questionVersionId: q.versionId, response: answers[q.id] as string })),
    };
    await api(`/attempts/${attemptId}/submit`, { method: 'POST', body: JSON.stringify(payload) });
    const review = await api<{ items: ReviewItem[] }>(`/attempts/${attemptId}/review`);
    setItems(review.items);
  }

  return (
    <main className="flex min-h-screen flex-col gap-4 p-4">
      <h1 className="text-xl font-semibold">Practice</h1>
      {objective && <p className="text-sm text-gray-600">Recommended objective: {objective}</p>}
      {questions.length === 0 && !items && (
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
            Start practice
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
      {questions.length > 0 && !items && (
        <button onClick={submit} className="rounded bg-black p-3 text-white">
          Submit
        </button>
      )}
      {items &&
        items.map((item) => (
          <div key={item.questionId} className="rounded border p-3">
            <p className="font-medium">{item.body}</p>
            <p className={item.isCorrect ? 'text-green-600' : 'text-red-600'}>
              Your answer: {item.response} —{' '}
              {item.isCorrect ? 'Correct' : `Wrong (answer: ${item.answerKey})`}
            </p>
            <p className="text-sm text-gray-600">{item.explanation}</p>
          </div>
        ))}
    </main>
  );
}
