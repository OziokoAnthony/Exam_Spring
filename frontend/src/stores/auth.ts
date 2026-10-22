'use client';

import { create } from 'zustand';

import type { SessionUser } from '@/lib/api/client';

export type Role = SessionUser['role'];

type AuthState = {
  user: SessionUser | null;
  /** True once a session restore has been attempted on this page load. */
  checked: boolean;
  setUser: (user: SessionUser | null) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  checked: false,
  setUser: (user) => set({ user, checked: true }),
  logout: () => set({ user: null, checked: true }),
}));

export function homeFor(user: SessionUser): string {
  if (user.status === 'PENDING_GUARDIAN_CONSENT') return '/consent/pending';
  return `/${user.role.toLowerCase()}`;
}
