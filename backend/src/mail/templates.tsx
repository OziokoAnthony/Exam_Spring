import { Text } from '@react-email/components';
import { render } from '@react-email/render';
import type { ReactElement } from 'react';

import { loadEnv } from '../config/env';
import { ActionLink, EmailLayout } from './layout';

export const EMAIL_TEMPLATES = [
  'welcome',
  'verify-email',
  'reset-password',
  'guardian-invite',
  'guardian-approved',
] as const;

export type EmailTemplate = (typeof EMAIL_TEMPLATES)[number];

type Data = Record<string, string>;

function linkTo(path: string, token: string): string {
  return `${loadEnv().WEB_ORIGIN}${path}?token=${encodeURIComponent(token)}`;
}

function GuardianInvite({ learnerName, token }: { learnerName: string; token: string }) {
  return (
    <EmailLayout
      preview={`${learnerName} needs your approval`}
      title={`${learnerName} wants to use ExamSpring`}
    >
      <Text>
        ExamSpring helps Nigerian students prepare for exams like WAEC and JAMB. Because{' '}
        {learnerName} is under 18, a parent or guardian must agree before the account can be used.
      </Text>
      <Text>
        <strong>What we collect:</strong> name, email, date of birth, exam target, answers, progress
        and study time.
      </Text>
      <Text>
        <strong>Why:</strong> to run the learning service, measure progress and improve content.
      </Text>
      <Text>
        <strong>Who sees it:</strong> the learner, you, teachers in their class, and our staff when
        needed. Never advertisers or data brokers. We do not sell data.
      </Text>
      <Text>
        <strong>Your rights:</strong> you can see, correct or delete this data, and withdraw consent
        at any time from your parent dashboard.
      </Text>
      <Text>
        The link expires in 7 days and works once. If you do not recognise this request, ignore this
        email and nothing will be shared.
      </Text>
      <ActionLink href={linkTo('/consent/approve', token)} label="Review and approve" />
    </EmailLayout>
  );
}

const TEMPLATES: Record<EmailTemplate, (d: Data) => ReactElement> = {
  welcome: (d) => (
    <EmailLayout
      preview="Your ExamSpring account is ready"
      title={`Welcome to ExamSpring, ${d.name ?? 'learner'}`}
    >
      <Text>Your account is ready.</Text>
    </EmailLayout>
  ),
  'verify-email': (d) => (
    <EmailLayout preview="Confirm your email address" title="Verify your email">
      <Text>Open this link to confirm your email address. It expires in 24 hours.</Text>
      <ActionLink href={linkTo('/verify-email', d.token ?? '')} label="Verify email" />
    </EmailLayout>
  ),
  'reset-password': (d) => (
    <EmailLayout preview="Reset your ExamSpring password" title="Reset your password">
      <Text>
        Open this link to choose a new password. It expires in 1 hour and works once. If you did not
        ask for this, ignore this email.
      </Text>
      <ActionLink href={linkTo('/reset-password', d.token ?? '')} label="Choose a new password" />
    </EmailLayout>
  ),
  'guardian-invite': (d) => (
    <GuardianInvite learnerName={d.learnerName ?? 'A learner'} token={d.token ?? ''} />
  ),
  'guardian-approved': (d) => (
    <EmailLayout preview="Consent recorded" title="Consent approved">
      <Text>
        Thank you, {d.guardianName ?? ''}. You can see progress and withdraw consent any time from
        your parent dashboard.
      </Text>
    </EmailLayout>
  ),
};

function isTemplate(name: string): name is EmailTemplate {
  return (EMAIL_TEMPLATES as readonly string[]).includes(name);
}

/** React escapes every interpolated value, so user-supplied names cannot inject HTML. */
export async function renderEmail(template: string, data: Data): Promise<string> {
  if (!isTemplate(template)) throw new Error(`Unknown email template: ${template}`);
  return render(TEMPLATES[template](data));
}
