'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';

import { api, setAccessToken } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth';

const schema = z.object({ email: z.string().email(), password: z.string().min(1) });

type FormData = z.infer<typeof schema>;

type LoginResponse = {
  user: {
    id: string;
    email: string;
    role: 'LEARNER' | 'PARENT' | 'TEACHER' | 'ADMIN';
    fullName: string;
    isMinor: boolean;
    emailVerified: boolean;
  };
  accessToken: string;
};

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    try {
      const res = await api<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      setAccessToken(res.accessToken);
      setUser(res.user);
      router.push(`/${res.user.role.toLowerCase()}`);
    } catch (error) {
      setError('root', { message: error instanceof Error ? error.message : 'Login failed' });
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <form onSubmit={handleSubmit(onSubmit)} className="flex w-full max-w-sm flex-col gap-4">
        <h1 className="text-2xl font-semibold">Log in</h1>
        <label className="flex flex-col gap-1 text-sm">
          Email
          <input type="email" {...register('email')} className="rounded border p-2" />
        </label>
        {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
        <label className="flex flex-col gap-1 text-sm">
          Password
          <input type="password" {...register('password')} className="rounded border p-2" />
        </label>
        {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
        {errors.root && <p className="text-sm text-red-600">{errors.root.message}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-black p-3 text-white disabled:opacity-50"
        >
          {isSubmitting ? 'Signing in…' : 'Log in'}
        </button>
        <a href="/signup" className="text-center text-sm text-blue-600">
          Create an account
        </a>
      </form>
    </main>
  );
}
