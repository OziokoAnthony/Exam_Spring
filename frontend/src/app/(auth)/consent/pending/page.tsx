'use client';

import { useState } from 'react';

import { AuthGate } from '@/components/AuthGate';
import { DashboardShell } from '@/components/DashboardShell';
import { Button, ErrorText, Field, inputClass } from '@/components/ui';
import { api, errorMessage } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth';

function ResendInvite() {
  const user = useAuthStore((s) => s.user);
  const [guardianEmail, setGuardianEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function send() {
    if (!user) return;
    setBusy(true);
    setError('');
    try {
      await api('/consent/guardian-invite', {
        method: 'POST',
        body: { learnerId: user.id, guardianEmail },
      });
      setSent(true);
    } catch (e) {
      setError(errorMessage(e, 'Could not send the invite'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded border p-4">
      <h2 className="font-medium">Send the approval email again</h2>
      <p className="text-sm text-gray-600">
        Links expire after 7 days. You can send a new one to the same or a different parent or
        guardian.
      </p>
      <Field label="Parent or guardian's email">
        <input
          type="email"
          value={guardianEmail}
          onChange={(e) => setGuardianEmail(e.target.value)}
          className={inputClass}
        />
      </Field>
      <Button onClick={send} busy={busy} disabled={!guardianEmail}>
        Send approval email
      </Button>
      {sent && (
        <p role="status" className="text-sm text-green-800">
          Sent. Ask them to check their inbox.
        </p>
      )}
      <ErrorText message={error} />
    </div>
  );
}

export default function ConsentPendingPage() {
  return (
    <AuthGate roles={['LEARNER']} allowPending>
      <DashboardShell title="Waiting for a parent or guardian">
        <p>
          Because you are under 18, a parent or guardian must approve your account before you can
          start practising. Once they approve, log out and log back in.
        </p>
        <ResendInvite />
      </DashboardShell>
    </AuthGate>
  );
}
