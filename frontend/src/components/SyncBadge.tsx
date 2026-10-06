'use client';

import { useEffect, useState } from 'react';

import { pendingCount, syncOfflineAttempts } from '@/lib/offline/sync';

export default function SyncBadge() {
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState('');

  useEffect(() => {
    pendingCount()
      .then(setCount)
      .catch(() => undefined);
    const onOnline = () => {
      syncOfflineAttempts()
        .then((r) => {
          setMessage(`Synced ${r.synced}, ${r.remaining} pending`);
          return pendingCount();
        })
        .then(setCount)
        .catch(() => setMessage('Sync failed'));
    };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, []);

  return (
    <p className="text-sm text-gray-500">
      Offline queue: {count} attempt{count === 1 ? '' : 's'} pending {message && `· ${message}`}
    </p>
  );
}
