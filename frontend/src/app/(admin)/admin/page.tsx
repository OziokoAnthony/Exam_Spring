import Link from 'next/link';

import { DashboardShell } from '@/components/DashboardShell';

export default function AdminDashboard() {
  return (
    <DashboardShell title="Admin">
      <ul className="grid gap-3 sm:grid-cols-2">
        <li>
          <Link href="/admin/questions" className="block rounded border p-4 hover:bg-gray-50">
            <span className="font-medium">Question review</span>
            <span className="mt-1 block text-sm text-gray-600">
              Approve or reject drafts, bulk import.
            </span>
          </Link>
        </li>
        <li>
          <Link href="/admin/notifications" className="block rounded border p-4 hover:bg-gray-50">
            <span className="font-medium">Email delivery</span>
            <span className="mt-1 block text-sm text-gray-600">
              Outbox status, retries and failures.
            </span>
          </Link>
        </li>
      </ul>
    </DashboardShell>
  );
}
