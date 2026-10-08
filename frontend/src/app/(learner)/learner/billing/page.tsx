'use client';

import { useState } from 'react';

import DashboardShell from '@/components/DashboardShell';
import { api } from '@/lib/api/client';

const PLANS = [
  { id: 'MONTHLY', label: 'Monthly', amount: '₦5,000' },
  { id: 'TERM', label: 'Termly', amount: '₦12,000' },
  { id: 'ANNUAL', label: 'Annual', amount: '₦40,000' },
] as const;

export default function BillingPage() {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  async function subscribe(plan: (typeof PLANS)[number]['id']) {
    setError('');
    try {
      const res = await api<{ reference: string; authorizationUrl: string }>('/billing/orders', {
        method: 'POST',
        body: JSON.stringify({ plan }),
      });
      setUrl(res.authorizationUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start checkout');
    }
  }

  return (
    <>
      <DashboardShell title="Billing" />
      <section className="flex flex-col gap-3 px-4 pb-8">
        {PLANS.map((p) => (
          <button
            key={p.id}
            onClick={() => subscribe(p.id)}
            className="rounded border p-3 text-left"
          >
            <span className="font-medium">{p.label}</span> — {p.amount}
          </button>
        ))}
        {error && <p className="text-red-600">{error}</p>}
        {url && (
          <a href={url} className="rounded bg-black px-4 py-3 text-center text-white">
            Continue to checkout
          </a>
        )}
      </section>
    </>
  );
}
