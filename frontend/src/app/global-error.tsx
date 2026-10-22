'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-3 p-4">
        <h1 className="text-2xl font-semibold">Something went wrong</h1>
        <p>We have been told about it. Your saved answers are safe.</p>
        <button onClick={reset} className="min-h-11 rounded bg-black px-4 text-white">
          Try again
        </button>
      </body>
    </html>
  );
}
