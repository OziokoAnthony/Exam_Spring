'use client';

import { useCallback, useEffect, useState } from 'react';

import { pendingCount, syncOfflineAttempts } from '@/lib/offline/sync';

/** "3 attempts pending" — SKILL.md 2.10. Syncs on load and whenever the device reconnects. */
export function SyncBadge() {
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState('');

  const sync = useCallback(async () => {
    try {
      if ((await pendingCount()) > 0 && navigator.onLine) {
        const r = await syncOfflineAttempts();
        setMessage(r.synced > 0 ? `Synced ${r.synced}` : '');
      }
    } catch {
      setMessage('Sync will retry when you are back online');
    } finally {
      setCount(await pendingCount().catch(() => 0));
    }
  }, []);

  useEffect(() => {
    void sync();
    window.addEventListener('online', sync);
    return () => window.removeEventListener('online', sync);
  }, [sync]);

  if (count === 0 && !message) return null;
  return (
    <p role="status" className="rounded bg-amber-50 p-2 text-sm text-amber-900">
      {count > 0 ? `${count} attempt${count === 1 ? '' : 's'} pending sync` : ''}
      {message && ` ${message}`}
    </p>
  );
}
