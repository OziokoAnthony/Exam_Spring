'use client';

import { useState } from 'react';

import { api } from '@/lib/api/client';

export default function VerifyEmailPage() {
  const [token, setToken] = useState('');
  const [message, setMessage] = useState('');

  async function verify() {
    try {
      await api('/auth/verify-email', { method: 'POST', body: JSON.stringify({ token }) });
      setMessage('Email verified. You can log in now.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Verification failed');
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="flex w-full max-w-sm flex-col gap-4">
        <h1 className="text-2xl font-semibold">Verify your email</h1>
        <input
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Paste verification token"
          className="rounded border p-2"
        />
        <button onClick={verify} className="rounded bg-black p-3 text-white">
          Verify
        </button>
        {message && <p className="text-sm">{message}</p>}
      </div>
    </main>
  );
}
