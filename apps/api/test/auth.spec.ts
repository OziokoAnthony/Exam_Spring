import 'dotenv/config';
import type { INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module';

describe('Auth endpoints', () => {
  let app: INestApplication;
  const email = `test-${Date.now()}@example.com`;
  const password = 'password123';

  beforeAll(async () => {
    const redis = new (await import('ioredis')).default(
      process.env.REDIS_URL ?? 'redis://localhost:6380',
    );
    const keys = await redis.keys('rl:*');
    if (keys.length > 0) await redis.del(...keys);
    redis.disconnect();
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('v1');
    app.use(cookieParser());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('signs up a new user', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/auth/signup')
      .send({ email, password, fullName: 'Test User', role: 'LEARNER', dateOfBirth: '2008-01-01' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(email);
  });

  it('rejects weak validation', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/auth/signup')
      .send({ email: 'not-an-email', password: 'short' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('logs in with valid credentials', async () => {
    const res = await request(app.getHttpServer()).post('/v1/auth/login').send({ email, password });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
  });

  it('rejects wrong password', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email, password: 'wrongpass1' });
    expect(res.status).toBe(401);
  });

  it('rotates refresh token', async () => {
    const login = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email, password });
    const cookie = login.headers['set-cookie'];
    const res = await request(app.getHttpServer()).post('/v1/auth/refresh').set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
  });

  it('returns forgot-password response without leaking existence', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/auth/reset-password')
      .send({ email: 'nobody@example.com' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
