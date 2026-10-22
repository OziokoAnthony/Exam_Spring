import type { NestExpressApplication } from '@nestjs/platform-express';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { api, createTestApp, prisma, resetRateLimits, uniqueEmail } from './helpers';

const ADULT_DOB = '1990-01-01';
const password = 'password123';

describe('Auth endpoints', () => {
  let app: NestExpressApplication;
  const email = uniqueEmail('auth');
  let verificationToken = '';

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(resetRateLimits);

  afterAll(async () => {
    await app.close();
  });

  it('signs up an adult as ACTIVE with the response envelope', async () => {
    const res = await api(app)
      .post('/v1/auth/signup')
      .send({ email, password, fullName: 'Test User', role: 'LEARNER', dateOfBirth: ADULT_DOB });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ success: true, meta: {} });
    expect(res.body.data.user).toMatchObject({ email, status: 'ACTIVE', isMinor: false });
    verificationToken = res.body.data.verificationToken;
    expect(verificationToken).toBeTruthy();
  });

  it('rejects invalid input with VALIDATION_ERROR', async () => {
    const res = await api(app)
      .post('/v1/auth/signup')
      .send({ email: 'not-an-email', password: 'short' });
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ success: false, error: { code: 'VALIDATION_ERROR' } });
  });

  it('rejects a duplicate email without saying it exists', async () => {
    const res = await api(app)
      .post('/v1/auth/signup')
      .send({ email, password, fullName: 'Dup', role: 'LEARNER', dateOfBirth: ADULT_DOB });
    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Unable to create account');
  });

  it('rate limits signup', async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 4; i += 1) {
      const res = await api(app).post('/v1/auth/signup').send({});
      statuses.push(res.status);
    }
    expect(statuses.at(-1)).toBe(429);
  });

  it('verifies email', async () => {
    const res = await api(app).post('/v1/auth/verify-email').send({ token: verificationToken });
    expect(res.status).toBe(200);
    const user = await prisma.user.findUnique({ where: { email } });
    expect(user?.emailVerifiedAt).not.toBeNull();
  });

  it('rejects a forged verification token', async () => {
    const res = await api(app).post('/v1/auth/verify-email').send({ token: 'nope' });
    expect(res.status).toBe(401);
  });

  it('logs in and sets an httpOnly refresh cookie', async () => {
    const res = await api(app).post('/v1/auth/login').send({ email, password });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
    expect(String(res.headers['set-cookie'])).toMatch(/refresh_token=.*HttpOnly/i);
  });

  it('rejects a wrong password', async () => {
    const res = await api(app).post('/v1/auth/login').send({ email, password: 'wrongpass1' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('rotates the refresh token and rejects reuse of the old one', async () => {
    const login = await api(app).post('/v1/auth/login').send({ email, password });
    const cookie = login.headers['set-cookie'];
    const first = await api(app).post('/v1/auth/refresh').set('Cookie', cookie);
    expect(first.status).toBe(200);
    const reused = await api(app).post('/v1/auth/refresh').set('Cookie', cookie);
    expect(reused.status).toBe(401);
  });

  it('logs out and revokes the session', async () => {
    const login = await api(app).post('/v1/auth/login').send({ email, password });
    const cookie = login.headers['set-cookie'];
    const out = await api(app).post('/v1/auth/logout').set('Cookie', cookie);
    expect(out.status).toBe(200);
    const after = await api(app).post('/v1/auth/refresh').set('Cookie', cookie);
    expect(after.status).toBe(401);
  });

  it('does not reveal whether a reset email exists', async () => {
    const res = await api(app)
      .post('/v1/auth/reset-password')
      .send({ email: uniqueEmail('nobody') });
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({});
  });

  it('resets the password with a single-use token', async () => {
    const reset = await api(app).post('/v1/auth/reset-password').send({ email });
    const token = reset.body.data.devToken;
    const newPassword = 'newpassword456';
    const confirm = await api(app)
      .post('/v1/auth/reset-password/confirm')
      .send({ token, newPassword });
    expect(confirm.status).toBe(200);
    const reuse = await api(app)
      .post('/v1/auth/reset-password/confirm')
      .send({ token, newPassword: 'another789' });
    expect(reuse.status).toBe(401);
    const login = await api(app).post('/v1/auth/login').send({ email, password: newPassword });
    expect(login.status).toBe(200);
  });

  it('rejects requests without a bearer token', async () => {
    const res = await api(app).get('/v1/attempts/mastery');
    expect(res.status).toBe(401);
  });

  it('serves the health check inside the envelope', async () => {
    const res = await api(app).get('/v1/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: { status: 'ok' }, meta: {} });
  });
});
