'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button, ErrorText, Field, inputClass } from '@/components/ui';
import { api, errorMessage, parseSession, setAccessToken } from '@/lib/api/client';
import { homeFor, useAuthStore } from '@/stores/auth';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Enter your password'),
});

type FormData = z.infer<typeof schema>;

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
      const session = parseSession(await api('/auth/login', { method: 'POST', body: data }));
      setAccessToken(session.accessToken);
      setUser(session.user);
      router.push(homeFor(session.user));
    } catch (error) {
      setError('root', { message: errorMessage(error, 'Login failed') });
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex w-full max-w-sm flex-col gap-4"
        noValidate
      >
        <h1 className="text-2xl font-semibold">Log in</h1>
        <Field label="Email">
          <input type="email" autoComplete="email" {...register('email')} className={inputClass} />
        </Field>
        <ErrorText message={errors.email?.message ?? ''} />
        <Field label="Password">
          <input
            type="password"
            autoComplete="current-password"
            {...register('password')}
            className={inputClass}
          />
        </Field>
        <ErrorText message={errors.password?.message ?? ''} />
        <ErrorText message={errors.root?.message ?? ''} />
        <Button type="submit" busy={isSubmitting}>
          Log in
        </Button>
        <Link href="/reset-password" className="text-center text-sm text-blue-700">
          Forgot password?
        </Link>
        <Link href="/signup" className="text-center text-sm text-blue-700">
          Create an account
        </Link>
      </form>
    </main>
  );
}
