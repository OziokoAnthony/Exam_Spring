'use client';

import { useCallback, useEffect, useState } from 'react';

import { DashboardShell } from '@/components/DashboardShell';
import { Button, Empty, ErrorText, Field, inputClass, Loading } from '@/components/ui';
import { api, errorMessage } from '@/lib/api/client';
import { useAction } from '@/lib/use-action';

type Question = {
  id: string;
  status: string;
  difficulty: number;
  currentVersion: {
    version: number;
    body: string;
    options: { key: string; text: string }[];
    answerKey: string;
    explanation: string;
    provenance: { source?: string; license?: string };
  } | null;
};

const STATUSES = ['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED'] as const;

function QuestionReview({
  question,
  onChange,
}: {
  question: Question;
  onChange: (status: string) => void;
}) {
  const { busy, error, run } = useAction();
  const v = question.currentVersion;
  const act = (action: 'approve' | 'reject') =>
    run(async () => {
      const updated = await api<{ status: string }>(`/questions/${question.id}/${action}`, {
        method: 'POST',
        body: {},
      });
      onChange(updated.status);
    });

  return (
    <li className="flex flex-col gap-2 rounded border p-3">
      <p className="text-xs text-gray-600">
        {question.status} · difficulty {question.difficulty}
        {v
          ? ` · version ${v.version} · source: ${v.provenance.source ?? '—'} (${v.provenance.license ?? 'no licence'})`
          : ''}
      </p>
      {v ? (
        <>
          <p className="font-medium">{v.body}</p>
          <ul className="text-sm">
            {v.options.map((o) => (
              <li
                key={o.key}
                className={o.key === v.answerKey ? 'font-semibold text-green-800' : ''}
              >
                {o.key}. {o.text} {o.key === v.answerKey ? '(answer)' : ''}
              </li>
            ))}
          </ul>
          <p className="text-sm text-gray-700">Explanation: {v.explanation}</p>
        </>
      ) : (
        <p className="text-red-700">No version — cannot be approved.</p>
      )}
      <div className="flex gap-2">
        <Button
          onClick={() => void act('approve')}
          busy={busy}
          disabled={!v || question.status === 'APPROVED'}
        >
          Approve
        </Button>
        <Button
          variant="secondary"
          onClick={() => void act('reject')}
          busy={busy}
          disabled={question.status === 'REJECTED'}
        >
          Reject
        </Button>
      </div>
      <ErrorText message={error} />
    </li>
  );
}

function BulkImport({ onDone }: { onDone: () => void }) {
  const [text, setText] = useState('');
  const [result, setResult] = useState('');
  const { busy, error, run, setError } = useAction();

  const submit = () =>
    run(async () => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        setError('That is not valid JSON');
        return;
      }
      const res = await api<{ createdCount: number; failed: { index: number; message: string }[] }>(
        '/questions/bulk',
        { method: 'POST', body: parsed },
      );
      setResult(
        `Imported ${res.createdCount}. Failed: ${res.failed.map((f) => `#${f.index + 1} (${f.message})`).join(', ') || 'none'}`,
      );
      onDone();
    });

  return (
    <details className="rounded border p-3">
      <summary className="cursor-pointer font-medium">Bulk import (JSON, up to 200)</summary>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="mt-2 h-40 w-full rounded border p-2 font-mono text-xs"
        placeholder='{"questions":[{...}]}'
      />
      <Button onClick={() => void submit()} busy={busy} disabled={!text} className="mt-2">
        Import as drafts
      </Button>
      {result && <p className="mt-2 text-sm">{result}</p>}
      <ErrorText message={error} />
    </details>
  );
}

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [status, setStatus] = useState<string>('DRAFT');
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setQuestions(null);
    api<Question[]>(status ? `/questions?status=${status}` : '/questions')
      .then(setQuestions)
      .catch((e: unknown) => setError(errorMessage(e, 'Could not load questions')));
  }, [status]);

  useEffect(load, [load]);

  return (
    <DashboardShell title="Question review">
      <p className="text-sm text-gray-700">
        Only approved questions reach learners. Check the answer, explanation and source before
        approving.
      </p>
      <BulkImport onDone={load} />
      <Field label="Show">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className={`${inputClass} w-56`}
        >
          <option value="">All</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace('_', ' ').toLowerCase()}
            </option>
          ))}
        </select>
      </Field>
      <ErrorText message={error} />
      {questions === null && !error && <Loading />}
      {questions?.length === 0 && <Empty>Nothing here.</Empty>}
      <ul className="flex flex-col gap-3">
        {questions?.map((q) => (
          <QuestionReview
            key={q.id}
            question={q}
            onChange={(s) =>
              setQuestions(
                (list) => list?.map((x) => (x.id === q.id ? { ...x, status: s } : x)) ?? null,
              )
            }
          />
        ))}
      </ul>
    </DashboardShell>
  );
}
