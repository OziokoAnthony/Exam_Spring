'use client';

import { create } from 'zustand';

type Role = 'LEARNER' | 'PARENT' | 'TEACHER' | 'ADMIN';

type User = {
  id: string;
  email: string;
  role: Role;
  fullName: string;
  isMinor: boolean;
  emailVerified: boolean;
};

type AuthState = {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),
}));
