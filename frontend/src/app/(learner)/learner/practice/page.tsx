'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { DashboardShell } from '@/components/DashboardShell';
import { QuestionCard, ReviewList, toAnswers } from '@/components/QuestionCard';
import type { ReviewItem, ServedQuestion } from '@/components/QuestionCard';
import { SubjectPicker } from '@/components/SubjectPicker';
import { Button, Empty, ErrorText, Field, inputClass, MasteryBar } from '@/components/ui';
import { api } from '@/lib/api/client';
import { useMastery } from '@/lib/mastery';
import { db } from '@/lib/offline/db';
import { findOfflinePack, finishOfflinePractice, pickPracticeSet } from '@/lib/offline/practice';
import type { PackQuestion } from '@/lib/offline/practice';
import { useAction } from '@/lib/use-action';

type Session = { attemptId: string; objective: string | null; questions: ServedQuestion[] };

function OnlinePractice({ subjectId }: { subjectId: string }) {
  const [session, setSession] = useState<Session | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [review, setReview] = useState<ReviewItem[] | null>(null);
  const { busy, error, run } = useAction();
  const mastery = useMastery(subjectId);

  const start = () =>
    run(async () => {
      setReview(null);
      setAnswers({});
      setSession(await api<Session>('/attempts/practice', { method: 'POST', body: { subjectId } }));
    });

  const submit = () =>
    run(async () => {
      if (!session) return;
      await api(`/attempts/${session.attemptId}/submit`, {
        method: 'POST',
        body: { answers: toAnswers(session.questions, answers) },
      });
      const res = await api<{ items: ReviewItem[] }>(`/attempts/${session.attemptId}/review`);
      setReview(res.items);
      await mastery.reload();
    });

  if (!session) {
    return (
      <>
        <Button onClick={start} busy={busy}>
          Start practice
        </Button>
        <ErrorText message={error} />
      </>
    );
  }
  return (
    <>
      <p className="rounded bg-blue-50 p-3 text-sm">
        Recommended topic: {session.objective ?? 'Mixed practice'}
      </p>
      {review ? (
        <>
          <ReviewList items={review} />
          <section className="flex flex-col gap-2">
            <h2 className="font-medium">Your progress</h2>
            {mastery.rows.map((r) => (
              <MasteryBar key={r.objectiveId} label={r.label} score={r.score} />
            ))}
          </section>
          <Button onClick={start} busy={busy}>
            Practise again
          </Button>
        </>
      ) : (
        <>
          {session.questions.map((q, i) => (
            <QuestionCard
              key={q.id}
              question={q}
              number={i + 1}
              selected={answers[q.id]}
              onSelect={(k) => setAnswers({ ...answers, [q.id]: k })}
            />
          ))}
          <Button onClick={submit} busy={busy}>
            Check answers
          </Button>
        </>
      )}
      <ErrorText message={error} />
    </>
  );
}

function OfflinePractice({ subjectId }: { subjectId: string }) {
  const [questions, setQuestions] = useState<PackQuestion[] | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [score, setScore] = useState<{ correct: number; total: number } | null>(null);
  const { busy, error, run } = useAction();

  useEffect(() => {
    void findOfflinePack(subjectId).then((pack) =>
      setQuestions(pack ? pickPracticeSet(pack.questions) : []),
    );
  }, [subjectId]);

  const finish = () =>
    run(async () => {
      if (questions) setScore(await finishOfflinePractice(subjectId, questions, answers));
    });

  if (questions === null) return null;
  if (questions.length === 0) {
    return (
      <Empty>
        You are offline and have no pack for this subject.{' '}
        <Link href="/learner/packs" className="underline">
          Download one
        </Link>{' '}
        when you are back online.
      </Empty>
    );
  }
  if (score) {
    return (
      <>
        <p role="status">
          {score.correct} of {score.total} correct. Saved on this device — it will sync and be
          scored when you reconnect.
        </p>
        <ol className="flex flex-col gap-3">
          {questions.map((q, i) => (
            <li key={q.id} className="rounded border p-3">
              <p className="font-medium">
                {i + 1}. {q.body}
              </p>
              <p className={answers[q.id] === q.answerKey ? 'text-green-800' : 'text-red-700'}>
                {answers[q.id] === q.answerKey ? 'Correct' : `Correct answer: ${q.answerKey}`}
              </p>
              <p className="text-sm text-gray-700">{q.explanation}</p>
            </li>
          ))}
        </ol>
      </>
    );
  }
  return (
    <>
      <p className="rounded bg-amber-50 p-3 text-sm">
        You are offline. Practising from your downloaded pack.
      </p>
      {questions.map((q, i) => (
        <QuestionCard
          key={q.id}
          question={q}
          number={i + 1}
          selected={answers[q.id]}
          onSelect={(k) => setAnswers({ ...answers, [q.id]: k })}
        />
      ))}
      <Button onClick={finish} busy={busy}>
        Check answers
      </Button>
      <ErrorText message={error} />
    </>
  );
}

function DownloadedPackPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const [packs, setPacks] = useState<{ subjectId: string; name: string }[]>([]);
  useEffect(() => {
    void db.contentPacks
      .toArray()
      .then((rows) => setPacks(rows.map((r) => ({ subjectId: r.subjectId, name: r.name }))));
  }, []);
  if (packs.length === 0) {
    return <Empty>You are offline and have no downloaded packs yet.</Empty>;
  }
  return (
    <Field label="Downloaded subject">
      <select value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}>
        <option value="">Choose a pack</option>
        {packs.map((p) => (
          <option key={p.subjectId} value={p.subjectId}>
            {p.name}
          </option>
        ))}
      </select>
    </Field>
  );
}

export default function PracticePage() {
  const [subjectId, setSubjectId] = useState('');
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  return (
    <DashboardShell title="Practice">
      {online ? (
        <SubjectPicker value={subjectId} onChange={setSubjectId} />
      ) : (
        <DownloadedPackPicker value={subjectId} onChange={setSubjectId} />
      )}
      {subjectId &&
        (online ? (
          <OnlinePractice key={subjectId} subjectId={subjectId} />
        ) : (
          <OfflinePractice key={subjectId} subjectId={subjectId} />
        ))}
    </DashboardShell>
  );
}
