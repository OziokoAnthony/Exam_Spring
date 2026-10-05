'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';

import { api } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(1),
  role: z.enum(['LEARNER', 'PARENT', 'TEACHER']),
  dateOfBirth: z.string().min(1),
});

type FormData = z.infer<typeof schema>;

export default function SignupPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { role: 'LEARNER' } });

  async function onSubmit(data: FormData) {
    try {
      const res = await api<{
        user: NonNullable<Parameters<typeof setUser>[0]>;
        verificationToken?: string;
      }>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      setUser(res.user);
      if (res.user.isMinor) router.push('/consent/pending');
      else router.push('/login');
    } catch (error) {
      setError('root', { message: error instanceof Error ? error.message : 'Signup failed' });
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <form onSubmit={handleSubmit(onSubmit)} className="flex w-full max-w-sm flex-col gap-4">
        <h1 className="text-2xl font-semibold">Create your account</h1>
        <label className="flex flex-col gap-1 text-sm">
          Full name
          <input {...register('fullName')} className="rounded border p-2" />
        </label>
        {errors.fullName && <p className="text-sm text-red-600">{errors.fullName.message}</p>}
        <label className="flex flex-col gap-1 text-sm">
          Email
          <input type="email" {...register('email')} className="rounded border p-2" />
        </label>
        {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
        <label className="flex flex-col gap-1 text-sm">
          Date of birth
          <input type="date" {...register('dateOfBirth')} className="rounded border p-2" />
        </label>
        {errors.dateOfBirth && <p className="text-sm text-red-600">{errors.dateOfBirth.message}</p>}
        <label className="flex flex-col gap-1 text-sm">
          Role
          <select {...register('role')} className="rounded border p-2">
            <option value="LEARNER">Learner</option>
            <option value="PARENT">Parent/Guardian</option>
            <option value="TEACHER">Teacher</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Password (min 8 chars)
          <input type="password" {...register('password')} className="rounded border p-2" />
        </label>
        {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
        {errors.root && <p className="text-sm text-red-600">{errors.root.message}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-black p-3 text-white disabled:opacity-50"
        >
          {isSubmitting ? 'Creating…' : 'Sign up'}
        </button>
        <a href="/login" className="text-center text-sm text-blue-600">
          Already have an account? Log in
        </a>
      </form>
    </main>
  );
}
