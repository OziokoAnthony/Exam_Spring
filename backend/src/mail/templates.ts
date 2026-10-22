import { loadEnv } from '../config/env';

export const EMAIL_TEMPLATES = [
  'welcome',
  'verify-email',
  'reset-password',
  'guardian-invite',
  'guardian-approved',
] as const;

export type EmailTemplate = (typeof EMAIL_TEMPLATES)[number];

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** All user-supplied values (names especially) are escaped before reaching HTML. */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ESCAPES[c] ?? c);
}

function link(path: string, token: string): string {
  const url = `${loadEnv().WEB_ORIGIN}${path}?token=${encodeURIComponent(token)}`;
  return `<p><a href="${escapeHtml(url)}">${escapeHtml(url)}</a></p>`;
}

type Data = Record<string, string>;

const TEMPLATES: Record<EmailTemplate, (d: Data) => string> = {
  welcome: (d) =>
    `<h1>Welcome to ExamSpring, ${escapeHtml(d.name ?? 'learner')}</h1><p>Your account is ready.</p>`,
  'verify-email': (d) =>
    `<h1>Verify your email</h1><p>Open this link to confirm your email address. It expires in 24 hours.</p>${link('/verify-email', d.token ?? '')}`,
  'reset-password': (d) =>
    `<h1>Reset your password</h1><p>Open this link to choose a new password. It expires in 1 hour and works once. If you did not ask for this, ignore this email.</p>${link('/reset-password', d.token ?? '')}`,
  'guardian-invite': (d) => {
    const name = escapeHtml(d.learnerName ?? 'A learner');
    return [
      `<h1>${name} wants to use ExamSpring</h1>`,
      `<p>ExamSpring helps Nigerian students prepare for exams like WAEC and JAMB. Because ${name} is under 18, we need a parent or guardian to agree before the account can be used.</p>`,
      '<p><strong>What we collect:</strong> name, email, date of birth, exam target, answers, progress and study time.</p>',
      '<p><strong>Why:</strong> to run the learning service, measure progress and improve content.</p>',
      '<p><strong>Who sees it:</strong> the learner, you, teachers in their class, and our staff when needed. Never advertisers or data brokers. We do not sell data.</p>',
      '<p><strong>Your rights:</strong> you can see, correct or delete this data, and withdraw consent at any time from your parent dashboard.</p>',
      '<p>To approve, open the link below and confirm your email address. It expires in 7 days and works once. If you do not recognise this request, ignore this email and nothing will be shared.</p>',
      link('/consent/approve', d.token ?? ''),
    ].join('');
  },
  'guardian-approved': (d) =>
    `<h1>Consent approved</h1><p>Thank you, ${escapeHtml(d.guardianName ?? '')}. You can see progress and withdraw consent any time from your parent dashboard.</p>`,
};

function isTemplate(name: string): name is EmailTemplate {
  return (EMAIL_TEMPLATES as readonly string[]).includes(name);
}

export function renderEmail(template: string, data: Data): string {
  if (!isTemplate(template)) throw new Error(`Unknown email template: ${template}`);
  return TEMPLATES[template](data);
}
