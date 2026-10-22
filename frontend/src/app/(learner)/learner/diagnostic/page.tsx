'use client';

import Link from 'next/link';
import { useState } from 'react';

import { DashboardShell } from '@/components/DashboardShell';
import { QuestionCard, toAnswers } from '@/components/QuestionCard';
import type { ServedQuestion } from '@/components/QuestionCard';
import { SubjectPicker } from '@/components/SubjectPicker';
import { Button, Empty, ErrorText, MasteryBar } from '@/components/ui';
import { api } from '@/lib/api/client';
import { useMastery } from '@/lib/mastery';
import { useAction } from '@/lib/use-action';

type Result = { correctCount: number; totalQuestions: number; scorePct: string | number };

function Results({ subjectId, result }: { subjectId: string; result: Result }) {
  const { strong, weak, rows, error } = useMastery(subjectId);
  return (
    <>
      <h2 className="text-2xl font-semibold">Score: {Math.round(Number(result.scorePct))}%</h2>
      <p className="text-gray-700">
        {result.correctCount} of {result.totalQuestions} correct
      </p>
      <ErrorText message={error} />
      <section className="flex flex-col gap-2">
        <h3 className="font-medium">Strong topics</h3>
        {strong.length === 0 ? (
          <Empty>None yet — keep practising.</Empty>
        ) : (
          strong.map((r) => <MasteryBar key={r.objectiveId} label={r.label} score={r.score} />)
        )}
      </section>
      <section className="flex flex-col gap-2">
        <h3 className="font-medium">Topics to work on</h3>
        {weak.length === 0 ? (
          <Empty>No weak topics found.</Empty>
        ) : (
          weak.map((r) => <MasteryBar key={r.objectiveId} label={r.label} score={r.score} />)
        )}
      </section>
      {rows.length > 0 && (
        <Link href="/learner/practice" className="rounded bg-black p-3 text-center text-white">
          Practise your recommended topic next
        </Link>
      )}
    </>
  );
}

export default function DiagnosticPage() {
  const [subjectId, setSubjectId] = useState('');
  const [attemptId, setAttemptId] = useState('');
  const [questions, setQuestions] = useState<ServedQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<Result | null>(null);
  const { busy, error, run } = useAction();

  const start = () =>
    run(async () => {
      const res = await api<{ attemptId: string; questions: ServedQuestion[] }>(
        '/attempts/diagnostic',
        {
          method: 'POST',
          body: { subjectId },
        },
      );
      setAttemptId(res.attemptId);
      setQuestions(res.questions);
    });

  const submit = () =>
    run(async () => {
      setResult(
        await api<Result>(`/attempts/${attemptId}/submit`, {
          method: 'POST',
          body: { answers: toAnswers(questions, answers) },
        }),
      );
    });

  const answered = Object.keys(answers).length;

  return (
    <DashboardShell title="Diagnostic">
      {result ? (
        <Results subjectId={subjectId} result={result} />
      ) : questions.length === 0 ? (
        <>
          <p>Answer 15 questions so we can find the topics where you are strong and weak.</p>
          <SubjectPicker value={subjectId} onChange={setSubjectId} />
          <Button onClick={start} busy={busy} disabled={!subjectId}>
            Start diagnostic
          </Button>
        </>
      ) : (
        <>
          {questions.map((q, i) => (
            <QuestionCard
              key={q.id}
              question={q}
              number={i + 1}
              selected={answers[q.id]}
              onSelect={(key) => setAnswers({ ...answers, [q.id]: key })}
            />
          ))}
          <Button onClick={submit} busy={busy}>
            Submit ({answered} of {questions.length} answered)
          </Button>
        </>
      )}
      <ErrorText message={error} />
    </DashboardShell>
  );
}
