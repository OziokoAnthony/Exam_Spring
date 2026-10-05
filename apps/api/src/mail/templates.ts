const TEMPLATES: Record<string, (data: Record<string, string>) => string> = {
  welcome: (d) =>
    `<h1>Welcome to ExamSpring, ${d.name ?? 'learner'}</h1><p>Your account is ready.</p>`,
  'verify-email': (d) => `<h1>Verify your email</h1><p>Token: ${d.token ?? ''}</p>`,
  'reset-password': (d) => `<h1>Reset your password</h1><p>Token: ${d.token ?? ''}</p>`,
  'guardian-invite': (d) =>
    `<h1>Consent needed for ${d.learnerName ?? 'a learner'}</h1><p>${d.learnerName ?? 'A learner'} signed up for ExamSpring. Approve consent with token: ${d.token ?? ''}</p>`,
  'guardian-approved': (d) => `<h1>Consent approved</h1><p>Thank you, ${d.guardianName ?? ''}.</p>`,
};

export function renderEmail(template: string, data: Record<string, string>): string {
  const render = TEMPLATES[template];
  if (!render) throw new Error(`Unknown email template: ${template}`);
  return render(data);
}
