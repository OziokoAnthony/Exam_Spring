'use client';

import { useEffect, useState } from 'react';

import { DashboardShell } from '@/components/DashboardShell';
import { Empty, ErrorText, Loading } from '@/components/ui';
import { api, errorMessage } from '@/lib/api/client';

type OutboxEvent = {
  id: string;
  eventType: string;
  status: string;
  attempts: number;
  createdAt: string;
  processedAt: string | null;
  lastError: string | null;
};

export default function AdminNotificationsPage() {
  const [events, setEvents] = useState<OutboxEvent[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api<OutboxEvent[]>('/notifications/outbox')
      .then(setEvents)
      .catch((e: unknown) => setError(errorMessage(e, 'Could not load the log')));
  }, []);

  return (
    <DashboardShell title="Email delivery">
      <p className="text-sm text-gray-700">
        Last 50 emails. Recipients are hidden. Failed emails retry up to 5 times, then move to DLQ.
      </p>
      <ErrorText message={error} />
      {events === null && !error && <Loading />}
      {events?.length === 0 && <Empty>No emails yet.</Empty>}
      {events?.map((e) => (
        <div key={e.id} className="rounded border p-3 text-sm">
          <p>
            <span className="font-medium">{e.eventType}</span> · {e.status} · attempts {e.attempts}
          </p>
          <p className="text-gray-600">
            {new Date(e.createdAt).toLocaleString()}
            {e.processedAt ? ` · processed ${new Date(e.processedAt).toLocaleString()}` : ''}
          </p>
          {e.lastError && <p className="text-red-600">{e.lastError}</p>}
        </div>
      ))}
    </DashboardShell>
  );
}
