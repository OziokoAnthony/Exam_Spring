'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import type { ReactNode } from 'react';

import { Loading } from '@/components/ui';
import { refreshSession } from '@/lib/api/client';
import { homeFor, useAuthStore } from '@/stores/auth';
import type { Role } from '@/stores/auth';

type Props = { roles: Role[]; allowPending?: boolean; children: ReactNode };

/** Client-side routing guard. The API enforces access; this only keeps the UI honest. */
export function AuthGate({ roles, allowPending = false, children }: Props) {
  const router = useRouter();
  const { user, checked, setUser } = useAuthStore();

  useEffect(() => {
    if (checked) return;
    void refreshSession().then(setUser);
  }, [checked, setUser]);

  const pendingBlocked = user?.status === 'PENDING_GUARDIAN_CONSENT' && !allowPending;
  const wrongRole = user !== null && !roles.includes(user.role);

  useEffect(() => {
    if (!checked) return;
    if (!user) router.replace('/login');
    else if (pendingBlocked || wrongRole) router.replace(homeFor(user));
  }, [checked, user, pendingBlocked, wrongRole, router]);

  if (!checked || !user || pendingBlocked || wrongRole)
    return <Loading label="Checking your session…" />;
  return <>{children}</>;
}
