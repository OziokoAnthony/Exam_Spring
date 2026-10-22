'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { DashboardShell } from '@/components/DashboardShell';
import { QuestionCard, ReviewList, toAnswers } from '@/components/QuestionCard';
import type { ReviewItem, ServedQuestion } from '@/components/QuestionCard';
import { SubjectPicker } from '@/components/SubjectPicker';
import { Button, ErrorText } from '@/components/ui';
import { api } from '@/lib/api/client';
import { useAction } from '@/lib/use-action';

type Exam = { attemptId: string; durationMs: number; questions: ServedQuestion[] };
type Result = { correctCount: number; totalQuestions: number; scorePct: string | number };

function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

function QuestionGrid(props: {
  questions: ServedQuestion[];
  answers: Record<string, string>;
  flagged: Record<string, boolean>;
  index: number;
  onJump: (i: number) => void;
}) {
  return (
    <nav aria-label="Questions" className="flex flex-wrap gap-1">
      {props.questions.map((q, i) => {
        const state = props.flagged[q.id]
          ? 'bg-amber-200'
          : props.answers[q.id]
            ? 'bg-green-200'
            : 'bg-white';
        return (
          <button
            key={q.id}
            onClick={() => props.onJump(i)}
            aria-current={i === props.index}
            aria-label={`Question ${i + 1}${props.flagged[q.id] ? ', flagged' : ''}${props.answers[q.id] ? ', answered' : ''}`}
            className={`h-11 w-11 rounded border ${state} ${i === props.index ? 'ring-2 ring-black' : ''}`}
          >
            {i + 1}
          </button>
        );
      })}
    </nav>
  );
}

export default function CbtPage() {
  const [subjectId, setSubjectId] = useState('');
  const [exam, setExam] = useState<Exam | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [index, setIndex] = useState(0);
  const [deadline, setDeadline] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [result, setResult] = useState<Result | null>(null);
  const [review, setReview] = useState<ReviewItem[]>([]);
  const { busy, error, run } = useAction();
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const submitted = useRef(false);

  const submit = useCallback(async () => {
    if (!exam || submitted.current) return;
    submitted.current = true;
    await run(async () => {
      const body = { answers: toAnswers(exam.questions, answersRef.current) };
      setResult(await api<Result>(`/attempts/${exam.attemptId}/submit`, { method: 'POST', body }));
      const res = await api<{ items: ReviewItem[] }>(`/attempts/${exam.attemptId}/review`);
      setReview(res.items);
    });
  }, [exam, run]);

  useEffect(() => {
    if (!exam || result) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [exam, result]);

  const remaining = deadline - now;
  useEffect(() => {
    if (exam && !result && remaining <= 0) void submit();
  }, [exam, result, remaining, submit]);

  const start = () =>
    run(async () => {
      const started = await api<Exam>('/attempts/cbt', { method: 'POST', body: { subjectId } });
      submitted.current = false;
      setAnswers({});
      setFlagged({});
      setIndex(0);
      setNow(Date.now());
      setDeadline(Date.now() + started.durationMs);
      setExam(started);
    });

  const q = exam?.questions[index];

  return (
    <DashboardShell title="CBT simulation">
      {result ? (
        <>
          <h2 className="text-2xl font-semibold">Score: {Math.round(Number(result.scorePct))}%</h2>
          <p>
            {result.correctCount} of {result.totalQuestions} correct
          </p>
          <ReviewList items={review} />
        </>
      ) : !exam ? (
        <>
          <p>20 questions, 25 minutes. The test submits itself when time runs out.</p>
          <SubjectPicker value={subjectId} onChange={setSubjectId} />
          <Button onClick={start} busy={busy} disabled={!subjectId}>
            Start CBT
          </Button>
        </>
      ) : (
        q && (
          <>
            <p
              role="timer"
              aria-live="off"
              className={`text-lg font-semibold ${remaining < 60_000 ? 'text-red-700' : ''}`}
            >
              Time left: {formatClock(remaining)}
            </p>
            <QuestionGrid
              questions={exam.questions}
              answers={answers}
              flagged={flagged}
              index={index}
              onJump={setIndex}
            />
            <QuestionCard
              question={q}
              number={index + 1}
              selected={answers[q.id]}
              onSelect={(k) => setAnswers({ ...answers, [q.id]: k })}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={() => setIndex(Math.max(0, index - 1))}
                disabled={index === 0}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                onClick={() => setIndex(Math.min(exam.questions.length - 1, index + 1))}
                disabled={index === exam.questions.length - 1}
              >
                Next
              </Button>
              <Button
                variant="secondary"
                onClick={() => setFlagged({ ...flagged, [q.id]: !flagged[q.id] })}
              >
                {flagged[q.id] ? 'Unflag' : 'Flag for review'}
              </Button>
              <Button onClick={() => void submit()} busy={busy}>
                Submit
              </Button>
            </div>
          </>
        )
      )}
      <ErrorText message={error} />
    </DashboardShell>
  );
}
