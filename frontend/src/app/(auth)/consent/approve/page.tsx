'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button, ErrorText, Field, inputClass } from '@/components/ui';
import { api, errorMessage } from '@/lib/api/client';
import { useQueryParam } from '@/lib/use-query-param';

const schema = z.object({
  guardianEmail: z.string().email('Enter the email address this invite was sent to'),
  guardianName: z.string().min(1, 'Enter your name').max(120),
  relationship: z.enum(['MOTHER', 'FATHER', 'GUARDIAN', 'OTHER']),
  agree: z.literal(true, { errorMap: () => ({ message: 'Tick the box to approve' }) }),
});

type FormData = z.infer<typeof schema>;

export default function ConsentApprovePage() {
  const token = useQueryParam('token');
  const [approved, setApproved] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { relationship: 'GUARDIAN' },
  });

  async function onSubmit(data: FormData) {
    const body = {
      token,
      guardianEmail: data.guardianEmail,
      guardianName: data.guardianName,
      relationship: data.relationship,
    };
    try {
      await api('/consent/guardian-approve', { method: 'POST', body });
      setApproved(true);
    } catch (error) {
      setError('root', { message: errorMessage(error, 'Approval failed') });
    }
  }

  if (approved) {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-3 p-4">
        <h1 className="text-2xl font-semibold">Thank you</h1>
        <p>Consent is recorded and the account is active. You can withdraw consent at any time.</p>
        <p className="text-sm text-gray-600">
          To see progress, set a password with &ldquo;Forgot password&rdquo; on the log-in page
          using this email address.
        </p>
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
        <h1 className="text-2xl font-semibold">Approve your child&rsquo;s account</h1>
        {!token && (
          <ErrorText message="This link is missing its approval code. Open the link from the email again." />
        )}
        <p className="text-sm text-gray-700">
          ExamSpring stores your child&rsquo;s name, email, date of birth, answers and progress to
          run the learning service. We never sell data or show ads. You can see, correct or delete
          it, and withdraw consent any time from your parent dashboard.
        </p>
        <Field label="Your email (the one this invite was sent to)">
          <input
            type="email"
            autoComplete="email"
            {...register('guardianEmail')}
            className={inputClass}
          />
        </Field>
        <ErrorText message={errors.guardianEmail?.message ?? ''} />
        <Field label="Your name">
          <input autoComplete="name" {...register('guardianName')} className={inputClass} />
        </Field>
        <ErrorText message={errors.guardianName?.message ?? ''} />
        <Field label="Relationship">
          <select {...register('relationship')} className={inputClass}>
            <option value="MOTHER">Mother</option>
            <option value="FATHER">Father</option>
            <option value="GUARDIAN">Guardian</option>
            <option value="OTHER">Other</option>
          </select>
        </Field>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" {...register('agree')} className="mt-1 h-5 w-5" />I am this
          child&rsquo;s parent or guardian and I agree to ExamSpring processing their data as
          described above.
        </label>
        <ErrorText message={errors.agree?.message ?? ''} />
        <ErrorText message={errors.root?.message ?? ''} />
        <Button type="submit" busy={isSubmitting} disabled={!token}>
          Approve
        </Button>
      </form>
    </main>
  );
}
