import type { NestExpressApplication } from '@nestjs/platform-express';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import {
  api,
  createTestApp,
  latestOutboxToken,
  prisma,
  resetRateLimits,
  signAccessToken,
  uniqueEmail,
} from './helpers';

const MINOR_DOB = '2012-05-01';
const password = 'password123';

async function signupMinor(app: NestExpressApplication, guardianEmail?: string) {
  const email = uniqueEmail('minor');
  const res = await api(app).post('/v1/auth/signup').send({
    email,
    password,
    fullName: 'Young Learner',
    role: 'LEARNER',
    dateOfBirth: MINOR_DOB,
    guardianEmail,
  });
  const login = await api(app).post('/v1/auth/login').send({ email, password });
  return {
    id: res.body.data.user.id as string,
    signup: res,
    token: login.body.data.accessToken as string,
  };
}

describe('Guardian consent flow', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(resetRateLimits);

  afterAll(async () => {
    await app.close();
  });

  it('creates minors as PENDING_GUARDIAN_CONSENT and blocks the platform', async () => {
    const minor = await signupMinor(app);
    expect(minor.signup.status).toBe(201);
    expect(minor.signup.body.data.user).toMatchObject({
      isMinor: true,
      status: 'PENDING_GUARDIAN_CONSENT',
    });
    const blocked = await api(app)
      .get('/v1/attempts/mastery')
      .set('Authorization', `Bearer ${minor.token}`);
    expect(blocked.status).toBe(403);
    expect(blocked.body.error.code).toBe('CONSENT_PENDING');
  });

  it('refuses non-learner accounts for under-18s', async () => {
    const res = await api(app)
      .post('/v1/auth/signup')
      .send({
        email: uniqueEmail('kid'),
        password,
        fullName: 'Kid',
        role: 'TEACHER',
        dateOfBirth: MINOR_DOB,
      });
    expect(res.status).toBe(400);
  });

  it('sends the invite at signup when a guardian email is given', async () => {
    const minor = await signupMinor(app, uniqueEmail('guardian'));
    await expect(latestOutboxToken(minor.id, 'guardian-invite')).resolves.toBeTruthy();
  });

  it('lets only the pending learner invite their guardian', async () => {
    const minor = await signupMinor(app);
    const other = await signupMinor(app);
    const forbidden = await api(app)
      .post('/v1/consent/guardian-invite')
      .set('Authorization', `Bearer ${other.token}`)
      .send({ learnerId: minor.id, guardianEmail: uniqueEmail('g') });
    expect(forbidden.status).toBe(403);
    const sameEmail = await prisma.user.findUniqueOrThrow({ where: { id: minor.id } });
    const selfInvite = await api(app)
      .post('/v1/consent/guardian-invite')
      .set('Authorization', `Bearer ${minor.token}`)
      .send({ learnerId: minor.id, guardianEmail: sameEmail.email });
    expect(selfInvite.status).toBe(400);
  });

  it('approves with a single-use token, activates the learner and records evidence', async () => {
    const guardianEmail = uniqueEmail('parent');
    const minor = await signupMinor(app);
    const invite = await api(app)
      .post('/v1/consent/guardian-invite')
      .set('Authorization', `Bearer ${minor.token}`)
      .send({ learnerId: minor.id, guardianEmail });
    expect(invite.status).toBe(201);
    const token = await latestOutboxToken(minor.id, 'guardian-invite');
    const body = { token, guardianEmail, guardianName: 'Ada Parent', relationship: 'MOTHER' };

    const wrongEmail = await api(app)
      .post('/v1/consent/guardian-approve')
      .send({ ...body, guardianEmail: uniqueEmail('imposter') });
    expect(wrongEmail.status).toBe(401);

    const approve = await api(app)
      .post('/v1/consent/guardian-approve')
      .set('User-Agent', 'vitest')
      .send(body);
    expect(approve.status).toBe(200);

    const learner = await prisma.user.findUniqueOrThrow({ where: { id: minor.id } });
    expect(learner.status).toBe('ACTIVE');
    const record = await prisma.consentRecord.findFirstOrThrow({ where: { userId: minor.id } });
    expect(record).toMatchObject({ consentType: 'DATA_PROCESSING', revokedAt: null });
    expect(record.evidence).toMatchObject({ method: 'email-token', userAgent: 'vitest' });
    const link = await prisma.guardianLink.findFirstOrThrow({ where: { learnerId: minor.id } });
    expect(link.status).toBe('ACTIVE');

    const reuse = await api(app).post('/v1/consent/guardian-approve').send(body);
    expect(reuse.status).toBe(401);

    const relogin = await api(app).post('/v1/auth/login').send({ email: learner.email, password });
    const unblocked = await api(app)
      .get('/v1/attempts/mastery')
      .set('Authorization', `Bearer ${relogin.body.data.accessToken}`);
    expect(unblocked.status).toBe(200);
  });

  it('lets the guardian revoke consent, suspending the learner', async () => {
    const guardianEmail = uniqueEmail('revoker');
    const minor = await signupMinor(app, guardianEmail);
    const token = await latestOutboxToken(minor.id, 'guardian-invite');
    await api(app)
      .post('/v1/consent/guardian-approve')
      .send({ token, guardianEmail, guardianName: 'Revoking Parent', relationship: 'FATHER' });
    const guardian = await prisma.user.findUniqueOrThrow({ where: { email: guardianEmail } });
    const res = await api(app)
      .post('/v1/consent/revoke')
      .set('Authorization', `Bearer ${signAccessToken(guardian.id, 'PARENT')}`)
      .send({ learnerId: minor.id });
    expect(res.status).toBe(200);
    const learner = await prisma.user.findUniqueOrThrow({ where: { id: minor.id } });
    expect(learner.status).toBe('SUSPENDED');
    const record = await prisma.consentRecord.findFirstOrThrow({ where: { userId: minor.id } });
    expect(record.revokedAt).not.toBeNull();
  });
});
