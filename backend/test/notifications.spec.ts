import type { NestExpressApplication } from '@nestjs/platform-express';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { escapeHtml, renderEmail } from '../src/mail/templates';
import { api, createTestApp, createUser, prisma, uniqueEmail } from './helpers';
import type { TestUser } from './helpers';

describe('Notifications and outbox', () => {
  let app: NestExpressApplication;
  let admin: TestUser;
  let learner: TestUser;
  const as = (u: TestUser) => ({ Authorization: `Bearer ${u.token}` });

  beforeAll(async () => {
    app = await createTestApp();
    admin = await createUser('ADMIN');
    learner = await createUser('LEARNER');
  });

  afterAll(async () => {
    await app.close();
  });

  it('lets only admins queue email and only known templates', async () => {
    const denied = await api(app)
      .post('/v1/notifications/email')
      .set(as(learner))
      .send({ to: uniqueEmail(), subject: 'Hi', template: 'welcome' });
    expect(denied.status).toBe(403);
    const unknown = await api(app)
      .post('/v1/notifications/email')
      .set(as(admin))
      .send({ to: uniqueEmail(), subject: 'Hi', template: 'phishing' });
    expect(unknown.status).toBe(400);
  });

  it('writes to the outbox and the worker delivers it', async () => {
    const res = await api(app)
      .post('/v1/notifications/email')
      .set(as(admin))
      .send({ to: uniqueEmail(), subject: 'Welcome', template: 'welcome', data: { name: 'Ada' } });
    expect(res.status).toBe(201);
    const event = await prisma.outboxEvent.findFirstOrThrow({
      where: { aggregateId: admin.id, eventType: 'welcome' },
      orderBy: { createdAt: 'desc' },
    });
    let status = event.status;
    for (let i = 0; i < 50 && status !== 'DONE'; i += 1) {
      await new Promise((r) => setTimeout(r, 100));
      status = (await prisma.outboxEvent.findUniqueOrThrow({ where: { id: event.id } })).status;
    }
    expect(status).toBe('DONE');
  });

  it('redacts PII in the admin outbox log', async () => {
    const res = await api(app).get('/v1/notifications/outbox').set(as(admin));
    expect(res.status).toBe(200);
    const text = JSON.stringify(res.body.data);
    expect(text).not.toMatch(/@example\.com/);
    expect(text).toContain('[REDACTED]');
    const denied = await api(app).get('/v1/notifications/outbox').set(as(learner));
    expect(denied.status).toBe(403);
  });

  it('escapes user-supplied names in email HTML', () => {
    const html = renderEmail('guardian-invite', { learnerName: '<script>x</script>', token: 't' });
    expect(html).not.toContain('<script>');
    expect(html).toContain(escapeHtml('<script>x</script>'));
    expect(html).toMatch(/\/consent\/approve\?token=t/);
  });
});
