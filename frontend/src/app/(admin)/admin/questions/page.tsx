'use client';

import { useEffect, useState } from 'react';

import { api } from '@/lib/api/client';

type Question = {
  id: string;
  status: string;
  difficulty: number;
  currentVersion: { body: string } | null;
};

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const url = status ? `/questions?status=${status}` : '/questions';
    api<Question[]>(url)
      .then(setQuestions)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed'));
  }, [status]);

  async function setQuestionStatus(id: string, action: 'approve' | 'reject') {
    await api(`/questions/${id}/${action}`, { method: 'POST', body: '{}' });
    setQuestions((qs) =>
      qs.map((q) =>
        q.id === id ? { ...q, status: action === 'approve' ? 'APPROVED' : 'REJECTED' } : q,
      ),
    );
  }

  const [importText, setImportText] = useState('');
  const [importResult, setImportResult] = useState('');

  async function bulkImport() {
    setImportResult('');
    try {
      const parsed = JSON.parse(importText) as unknown;
      const res = await api<{ createdCount: number; failed: { index: number }[] }>(
        '/questions/bulk',
        {
          method: 'POST',
          body: JSON.stringify(parsed),
        },
      );
      setImportResult(`Imported ${res.createdCount}, failed ${res.failed.length}`);
    } catch (e) {
      setImportResult(e instanceof Error ? e.message : 'Invalid payload');
    }
  }

  return (
    <main className="flex min-h-screen flex-col gap-4 p-4">
      <h1 className="text-xl font-semibold">Question review queue</h1>
      <details className="rounded border p-3">
        <summary className="cursor-pointer font-medium">Bulk import (JSON)</summary>
        <textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          className="mt-2 h-40 w-full rounded border p-2 font-mono text-xs"
          placeholder='{"questions":[{...}]}'
        />
        <button onClick={bulkImport} className="mt-2 rounded bg-black px-4 py-2 text-white">
          Import
        </button>
        {importResult && <p className="mt-2 text-sm text-gray-700">{importResult}</p>}
      </details>
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="w-48 rounded border p-2"
      >
        <option value="">All</option>
        <option value="DRAFT">Draft</option>
        <option value="PENDING_REVIEW">Pending review</option>
        <option value="APPROVED">Approved</option>
        <option value="REJECTED">Rejected</option>
      </select>
      {error && <p className="text-red-600">{error}</p>}
      {questions.map((q) => (
        <div key={q.id} className="rounded border p-3">
          <p className="text-sm text-gray-500">
            {q.status} · difficulty {q.difficulty}
          </p>
          <p className="font-medium">{q.currentVersion?.body ?? '(no version)'}</p>
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => setQuestionStatus(q.id, 'approve')}
              className="rounded border px-3 py-1"
            >
              Approve
            </button>
            <button
              onClick={() => setQuestionStatus(q.id, 'reject')}
              className="rounded border px-3 py-1"
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </main>
  );
}
