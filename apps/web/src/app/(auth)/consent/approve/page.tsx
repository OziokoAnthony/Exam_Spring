'use client';

import { useState } from 'react';

import { api } from '@/lib/api/client';

export default function ConsentApprovePage() {
  const [token, setToken] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [relationship, setRelationship] = useState('GUARDIAN');
  const [message, setMessage] = useState('');

  async function approve() {
    try {
      await api('/consent/guardian-approve', {
        method: 'POST',
        body: JSON.stringify({ token, guardianName, relationship }),
      });
      setMessage('Consent recorded. Thank you!');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Approval failed');
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="flex w-full max-w-sm flex-col gap-4">
        <h1 className="text-2xl font-semibold">Approve consent</h1>
        <input
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Consent token from email"
          className="rounded border p-2"
        />
        <input
          value={guardianName}
          onChange={(e) => setGuardianName(e.target.value)}
          placeholder="Your name"
          className="rounded border p-2"
        />
        <select
          value={relationship}
          onChange={(e) => setRelationship(e.target.value)}
          className="rounded border p-2"
        >
          <option value="MOTHER">Mother</option>
          <option value="FATHER">Father</option>
          <option value="GUARDIAN">Guardian</option>
          <option value="OTHER">Other</option>
        </select>
        <button onClick={approve} className="rounded bg-black p-3 text-white">
          Approve
        </button>
        {message && <p className="text-sm">{message}</p>}
      </div>
    </main>
  );
}
