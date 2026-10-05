'use client';

import { useAuthStore } from '@/stores/auth';
import { api, setAccessToken } from '@/lib/api/client';
import { useRouter } from 'next/navigation';

export default function DashboardShell({ title }: { title: string }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  async function onLogout() {
    try {
      await api('/auth/logout', { method: 'POST', body: '{}' });
    } finally {
      setAccessToken(null);
      logout();
      router.push('/login');
    }
  }

  return (
    <main className="flex min-h-screen flex-col gap-4 p-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{title}</h1>
        <button onClick={onLogout} className="rounded border px-3 py-2 text-sm">
          Log out
        </button>
      </header>
      <p className="text-gray-600">
        {user ? `Signed in as ${user.fullName} (${user.role})` : 'Not signed in'}
      </p>
      <p className="text-gray-600">Nothing here yet — this fills in on Day 6+.</p>
    </main>
  );
}
