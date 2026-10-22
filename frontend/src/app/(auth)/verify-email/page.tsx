'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { ErrorText, Loading } from '@/components/ui';
import { api, errorMessage } from '@/lib/api/client';
import { useQueryParam } from '@/lib/use-query-param';

type State = 'idle' | 'verifying' | 'verified' | 'failed';

export default function VerifyEmailPage() {
  const token = useQueryParam('token');
  const [state, setState] = useState<State>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    setState('verifying');
    api('/auth/verify-email', { method: 'POST', body: { token } })
      .then(() => setState('verified'))
      .catch((e: unknown) => {
        setError(errorMessage(e, 'Verification failed'));
        setState('failed');
      });
  }, [token]);

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-3 p-4">
      <h1 className="text-2xl font-semibold">Verify your email</h1>
      {state === 'idle' && <p>Open the link we emailed you to verify your address.</p>}
      {state === 'verifying' && <Loading label="Verifying…" />}
      {state === 'verified' && <p role="status">Your email is verified.</p>}
      {state === 'failed' && <ErrorText message={`${error}. The link may have expired.`} />}
      <Link href="/login" className="rounded bg-black p-3 text-center text-white">
        Go to log in
      </Link>
    </main>
  );
}
