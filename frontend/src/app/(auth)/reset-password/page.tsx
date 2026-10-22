'use client';

import Link from 'next/link';
import { useState } from 'react';

import { Button, ErrorText, Field, inputClass } from '@/components/ui';
import { api, errorMessage } from '@/lib/api/client';
import { useQueryParam } from '@/lib/use-query-param';

function RequestReset() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    setBusy(true);
    setError('');
    try {
      await api('/auth/reset-password', { method: 'POST', body: { email } });
      setSent(true);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  if (sent)
    return (
      <p role="status">
        If that email has an account, we have sent a reset link. It works once and expires in 1
        hour.
      </p>
    );
  return (
    <>
      <Field label="Email">
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
      </Field>
      <Button onClick={submit} busy={busy} disabled={!email}>
        Send reset link
      </Button>
      <ErrorText message={error} />
    </>
  );
}

function ChooseNewPassword({ token }: { token: string }) {
  const [newPassword, setNewPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    setBusy(true);
    setError('');
    try {
      await api('/auth/reset-password/confirm', { method: 'POST', body: { token, newPassword } });
      setDone(true);
    } catch (e) {
      setError(errorMessage(e, 'Reset failed'));
    } finally {
      setBusy(false);
    }
  }

  if (done) return <p role="status">Password updated. You have been logged out everywhere else.</p>;
  return (
    <>
      <Field label="New password (at least 8 characters)">
        <input
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className={inputClass}
        />
      </Field>
      <Button onClick={submit} busy={busy} disabled={newPassword.length < 8}>
        Update password
      </Button>
      <ErrorText message={error} />
    </>
  );
}

export default function ResetPasswordPage() {
  const token = useQueryParam('token');
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-3 p-4">
      <h1 className="text-2xl font-semibold">Reset password</h1>
      {token ? <ChooseNewPassword token={token} /> : <RequestReset />}
      <Link href="/login" className="text-center text-sm text-blue-700">
        Back to log in
      </Link>
    </main>
  );
}
