'use client';

import { useEffect, useState } from 'react';

import { api } from '@/lib/api/client';

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
  const [events, setEvents] = useState<OutboxEvent[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api<OutboxEvent[]>('/notifications/outbox')
      .then(setEvents)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed'));
  }, []);

  return (
    <main className="flex min-h-screen flex-col gap-4 p-4">
      <h1 className="text-xl font-semibold">Notification delivery log</h1>
      {error && <p className="text-red-600">{error}</p>}
      {events.map((e) => (
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
    </main>
  );
}
