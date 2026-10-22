'use client';

import { useCallback, useState } from 'react';

import { errorMessage } from '@/lib/api/client';

/** Wraps an async UI action with busy and error state. */
export function useAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = useCallback(async (action: () => Promise<void>, fallback?: string) => {
    setBusy(true);
    setError('');
    try {
      await action();
    } catch (e) {
      setError(errorMessage(e, fallback));
    } finally {
      setBusy(false);
    }
  }, []);

  return { busy, error, run, setError };
}
