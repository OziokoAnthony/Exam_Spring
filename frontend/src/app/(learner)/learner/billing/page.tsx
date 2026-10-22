'use client';

import { useState } from 'react';

import { DashboardShell } from '@/components/DashboardShell';
import { Button, ErrorText } from '@/components/ui';
import { api } from '@/lib/api/client';
import { useAction } from '@/lib/use-action';

// Display only — the server prices every order.
const PLANS = [
  { id: 'MONTHLY', label: 'Monthly', amount: '₦5,000' },
  { id: 'TERM', label: 'Per term', amount: '₦12,000' },
  { id: 'ANNUAL', label: 'Yearly', amount: '₦40,000' },
] as const;

type Plan = (typeof PLANS)[number]['id'];

export default function BillingPage() {
  const [selected, setSelected] = useState<Plan | null>(null);
  const { busy, error, run } = useAction();

  const checkout = (plan: Plan) =>
    run(async () => {
      setSelected(plan);
      const res = await api<{ authorizationUrl: string }>('/billing/orders', {
        method: 'POST',
        body: { plan },
      });
      window.location.assign(res.authorizationUrl);
    }, 'Could not start checkout');

  return (
    <DashboardShell title="Plans">
      <p className="text-sm text-gray-700">
        Payments are handled securely by Paystack. We never see your card details.
      </p>
      <ul className="flex flex-col gap-3">
        {PLANS.map((p) => (
          <li key={p.id} className="flex items-center justify-between rounded border p-3">
            <span>
              <span className="font-medium">{p.label}</span> · {p.amount}
            </span>
            <Button
              onClick={() => void checkout(p.id)}
              busy={busy && selected === p.id}
              disabled={busy}
            >
              Choose
            </Button>
          </li>
        ))}
      </ul>
      <ErrorText message={error} />
    </DashboardShell>
  );
}
