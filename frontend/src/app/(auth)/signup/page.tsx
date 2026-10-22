'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button, ErrorText, Field, inputClass } from '@/components/ui';
import { api, errorMessage } from '@/lib/api/client';

function isUnder18(dob: string): boolean {
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return false;
  const eighteenth = new Date(birth.getFullYear() + 18, birth.getMonth(), birth.getDate());
  return eighteenth > new Date();
}

const schema = z
  .object({
    fullName: z.string().min(1, 'Enter your name').max(120),
    email: z.string().email('Enter a valid email'),
    dateOfBirth: z.string().date('Enter your date of birth'),
    role: z.enum(['LEARNER', 'PARENT', 'TEACHER']),
    guardianEmail: z.string().optional(),
    password: z.string().min(8, 'At least 8 characters').max(72),
  })
  .superRefine((data, ctx) => {
    if (!isUnder18(data.dateOfBirth)) return;
    if (data.role !== 'LEARNER') {
      ctx.addIssue({
        code: 'custom',
        path: ['role'],
        message: 'Under-18s can only join as learners',
      });
    }
    const guardian = z.string().email().safeParse(data.guardianEmail);
    if (!guardian.success) {
      ctx.addIssue({
        code: 'custom',
        path: ['guardianEmail'],
        message: "Enter your parent or guardian's email",
      });
    } else if (guardian.data.toLowerCase() === data.email.toLowerCase()) {
      ctx.addIssue({
        code: 'custom',
        path: ['guardianEmail'],
        message: 'Use a different email from your own',
      });
    }
  });

type FormData = z.infer<typeof schema>;

export default function SignupPage() {
  const [done, setDone] = useState<'minor' | 'adult' | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { role: 'LEARNER' } });
  const minor = isUnder18(watch('dateOfBirth') ?? '');

  async function onSubmit(data: FormData) {
    const { guardianEmail, ...rest } = data;
    const body = minor ? { ...rest, role: 'LEARNER', guardianEmail } : rest;
    try {
      await api('/auth/signup', { method: 'POST', body });
      setDone(minor ? 'minor' : 'adult');
    } catch (error) {
      setError('root', { message: errorMessage(error, 'Signup failed') });
    }
  }

  if (done) {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-4">
        <h1 className="text-2xl font-semibold">Check your email</h1>
        <p>We sent you a link to verify your email address.</p>
        {done === 'minor' && (
          <p>
            We also emailed your parent or guardian. You can start once they approve. This keeps
            your information safe.
          </p>
        )}
        <Link href="/login" className="rounded bg-black p-3 text-center text-white">
          Go to log in
        </Link>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex w-full max-w-sm flex-col gap-3"
        noValidate
      >
        <h1 className="text-2xl font-semibold">Create your account</h1>
        <Field label="Full name">
          <input autoComplete="name" {...register('fullName')} className={inputClass} />
        </Field>
        <ErrorText message={errors.fullName?.message ?? ''} />
        <Field label="Email">
          <input type="email" autoComplete="email" {...register('email')} className={inputClass} />
        </Field>
        <ErrorText message={errors.email?.message ?? ''} />
        <Field label="Date of birth">
          <input type="date" {...register('dateOfBirth')} className={inputClass} />
        </Field>
        <ErrorText message={errors.dateOfBirth?.message ?? ''} />
        {minor ? (
          <>
            <p className="rounded bg-blue-50 p-3 text-sm">
              Because you are under 18, a parent or guardian must approve your account. We only use
              their email to ask for approval.
            </p>
            <Field label="Parent or guardian's email">
              <input type="email" {...register('guardianEmail')} className={inputClass} />
            </Field>
            <ErrorText message={errors.guardianEmail?.message ?? ''} />
          </>
        ) : (
          <Field label="I am a">
            <select {...register('role')} className={inputClass}>
              <option value="LEARNER">Learner</option>
              <option value="PARENT">Parent or guardian</option>
              <option value="TEACHER">Teacher</option>
            </select>
          </Field>
        )}
        <ErrorText message={errors.role?.message ?? ''} />
        <Field label="Password (at least 8 characters)">
          <input
            type="password"
            autoComplete="new-password"
            {...register('password')}
            className={inputClass}
          />
        </Field>
        <ErrorText message={errors.password?.message ?? ''} />
        <ErrorText message={errors.root?.message ?? ''} />
        <Button type="submit" busy={isSubmitting}>
          Sign up
        </Button>
        <Link href="/login" className="text-center text-sm text-blue-700">
          Already have an account? Log in
        </Link>
      </form>
    </main>
  );
}
