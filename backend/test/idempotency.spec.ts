import { randomUUID } from 'node:crypto';

import type { NestExpressApplication } from '@nestjs/platform-express';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { OutboxService } from '../src/outbox/outbox.service';
import {
  api,
  createApprovedQuestions,
  createCurriculum,
  createTestApp,
  createUser,
  prisma,
  uniqueEmail,
} from './helpers';
import type { TestUser } from './helpers';

describe('Idempotency-Key and outbox reliability', () => {
  let app: NestExpressApplication;
  let learner: TestUser;
  let admin: TestUser;

  beforeAll(async () => {
    app = await createTestApp();
    learner = await createUser('LEARNER');
    admin = await createUser('ADMIN');
  });

  afterAll(async () => {
    await app.close();
  });

  function createOrder(key: string, plan = 'MONTHLY', user = learner) {
    return api(app)
      .post('/v1/billing/orders')
      .set('Authorization', `Bearer ${user.token}`)
      .set('Idempotency-Key', key)
      .send({ plan });
  }

  it('replays the first response for a repeated key', async () => {
    const key = randomUUID();
    const first = await createOrder(key);
    const second = await createOrder(key);
    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(second.body.data.order.id).toBe(first.body.data.order.id);
    expect(await prisma.paymentOrder.count({ where: { userId: learner.id } })).toBe(1);
  });

  it('rejects a reused key with a different body', async () => {
    const key = randomUUID();
    await createOrder(key, 'MONTHLY');
    const res = await createOrder(key, 'ANNUAL');
    expect(res.status).toBe(422);
  });

  it('scopes keys per user', async () => {
    const key = randomUUID();
    const other = await createUser('LEARNER');
    const mine = await createOrder(key);
    const theirs = await createOrder(key, 'MONTHLY', other);
    expect(theirs.body.data.order.id).not.toBe(mine.body.data.order.id);
  });

  it('does not cache failures, so a corrected retry succeeds', async () => {
    const key = randomUUID();
    const bad = await api(app)
      .post('/v1/attempts/diagnostic')
      .set('Authorization', `Bearer ${learner.token}`)
      .set('Idempotency-Key', key)
      .send({ subjectId: randomUUID() });
    expect(bad.status).toBe(404);
    const curriculum = await createCurriculum(1);
    await createApprovedQuestions(curriculum, admin.id, 1);
    const fixed = await api(app)
      .post('/v1/attempts/diagnostic')
      .set('Authorization', `Bearer ${learner.token}`)
      .set('Idempotency-Key', key)
      .send({ subjectId: curriculum.subjectId });
    expect(fixed.status).toBe(201);
  });

  it('rejects malformed keys', async () => {
    const res = await createOrder('bad key!');
    expect(res.status).toBe(400);
  });

  it('marks a failing email FAILED with a redacted error, for retry', async () => {
    const outbox = app.get(OutboxService);
    const to = uniqueEmail('broken');
    await outbox.enqueueEmail(to, 'Broken', 'not-a-template', {}, admin.id);
    let event = await prisma.outboxEvent.findFirstOrThrow({
      where: { aggregateId: admin.id, eventType: 'not-a-template' },
    });
    for (let i = 0; i < 50 && event.status !== 'FAILED'; i += 1) {
      await new Promise((r) => setTimeout(r, 100));
      event = await prisma.outboxEvent.findUniqueOrThrow({ where: { id: event.id } });
    }
    expect(event).toMatchObject({ status: 'FAILED', attempts: 1 });
    expect(event.lastError).toContain('Unknown email template');
    expect(event.lastError).not.toContain(to);
  });
});
