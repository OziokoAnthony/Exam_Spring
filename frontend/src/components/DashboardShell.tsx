'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';

import { SyncBadge } from '@/components/SyncBadge';
import { api, setAccessToken } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth';
import type { Role } from '@/stores/auth';

const NAV: Record<Role, { href: string; label: string }[]> = {
  LEARNER: [
    { href: '/learner', label: 'Home' },
    { href: '/learner/diagnostic', label: 'Diagnostic' },
    { href: '/learner/practice', label: 'Practice' },
    { href: '/learner/cbt', label: 'CBT' },
    { href: '/learner/packs', label: 'Offline' },
    { href: '/learner/report', label: 'Report' },
    { href: '/learner/billing', label: 'Billing' },
  ],
  PARENT: [{ href: '/parent', label: 'Children' }],
  TEACHER: [{ href: '/teacher', label: 'Classes' }],
  ADMIN: [
    { href: '/admin', label: 'Home' },
    { href: '/admin/questions', label: 'Questions' },
    { href: '/admin/notifications', label: 'Emails' },
  ],
};

export function DashboardShell({ title, children }: { title: string; children?: ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  async function onLogout() {
    try {
      await api('/auth/logout', { method: 'POST', body: {} });
    } catch {
      // Logging out locally still matters if the network call fails.
    } finally {
      setAccessToken(null);
      logout();
      router.push('/login');
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-4 p-4">
      <header className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">{title}</h1>
          {user && <p className="text-sm text-gray-600">{user.fullName}</p>}
        </div>
        <button onClick={onLogout} className="min-h-11 rounded border px-3 text-sm">
          Log out
        </button>
      </header>
      {user && (
        <nav aria-label="Main" className="-mx-1 flex gap-1 overflow-x-auto pb-1">
          {NAV[user.role].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded px-3 py-2 text-sm underline-offset-4 hover:underline"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
      {user?.role === 'LEARNER' && <SyncBadge />}
      <main className="flex flex-col gap-4">{children}</main>
    </div>
  );
}
