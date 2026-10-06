'use client';

import { useState } from 'react';

import { api } from '@/lib/api/client';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');

  async function requestReset() {
    await api('/auth/reset-password', { method: 'POST', body: JSON.stringify({ email }) });
    setMessage('If that email is registered, a reset link has been sent.');
  }

  async function confirmReset() {
    try {
      await api('/auth/reset-password/confirm', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword }),
      });
      setMessage('Password updated. You can log in now.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Reset failed');
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="flex w-full max-w-sm flex-col gap-4">
        <h1 className="text-2xl font-semibold">Reset password</h1>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email"
          className="rounded border p-2"
        />
        <button onClick={requestReset} className="rounded bg-black p-3 text-white">
          Send reset token
        </button>
        <input
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Reset token"
          className="rounded border p-2"
        />
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="New password (min 8)"
          className="rounded border p-2"
        />
        <button onClick={confirmReset} className="rounded bg-black p-3 text-white">
          Update password
        </button>
        {message && <p className="text-sm">{message}</p>}
      </div>
    </main>
  );
}
