import { createHmac, randomUUID } from 'node:crypto';

import type { NestExpressApplication } from '@nestjs/platform-express';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { api, createTestApp, createUser, prisma } from './helpers';
import type { TestUser } from './helpers';

const SECRET = 'test-paystack-secret';

function sign(body: string): string {
  return createHmac('sha512', SECRET).update(body).digest('hex');
}

function chargeSuccess(reference: string, amount: number, currency = 'NGN') {
  return JSON.stringify({
    event: 'charge.success',
    data: { id: Math.floor(Math.random() * 1e9), reference, amount, currency },
  });
}

describe('Billing', () => {
  let app: NestExpressApplication;
  let learner: TestUser;
  const previousSecret = process.env.PAYSTACK_SECRET_KEY;

  beforeAll(async () => {
    process.env.PAYSTACK_SECRET_KEY = SECRET;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
      Response.json({
        status: true,
        data: { authorization_url: 'https://checkout.paystack.com/x' },
      }),
    );
    app = await createTestApp();
    learner = await createUser('LEARNER');
  });

  afterAll(async () => {
    vi.restoreAllMocks();
    process.env.PAYSTACK_SECRET_KEY = previousSecret;
    await app.close();
  });

  async function createOrder(user: TestUser) {
    const res = await api(app)
      .post('/v1/billing/orders')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ plan: 'MONTHLY' });
    return res;
  }

  function postWebhook(body: string, signature: string) {
    return api(app)
      .post('/v1/billing/webhooks/paystack')
      .set('Content-Type', 'application/json')
      .set('x-paystack-signature', signature)
      .send(body);
  }

  it('creates an order priced on the server', async () => {
    const res = await createOrder(learner);
    expect(res.status).toBe(201);
    expect(res.body.data.order).toMatchObject({ status: 'PENDING', amountKobo: 500000 });
    expect(res.body.data.authorizationUrl).toBe('https://checkout.paystack.com/x');
  });

  it('rejects unknown plans', async () => {
    const res = await api(app)
      .post('/v1/billing/orders')
      .set('Authorization', `Bearer ${learner.token}`)
      .send({ plan: 'FREE_FOREVER' });
    expect(res.status).toBe(400);
  });

  it('only shows an order to its owner or an admin', async () => {
    const order = (await createOrder(learner)).body.data.order as { id: string };
    const other = await createUser('LEARNER');
    const admin = await createUser('ADMIN');
    const own = await api(app)
      .get(`/v1/billing/orders/${order.id}`)
      .set('Authorization', `Bearer ${learner.token}`);
    const foreign = await api(app)
      .get(`/v1/billing/orders/${order.id}`)
      .set('Authorization', `Bearer ${other.token}`);
    const asAdmin = await api(app)
      .get(`/v1/billing/orders/${order.id}`)
      .set('Authorization', `Bearer ${admin.token}`);
    expect([own.status, foreign.status, asAdmin.status]).toEqual([200, 403, 200]);
    const missing = await api(app)
      .get(`/v1/billing/orders/${randomUUID()}`)
      .set('Authorization', `Bearer ${learner.token}`);
    expect(missing.status).toBe(404);
  });

  it('rejects webhooks with a bad signature', async () => {
    const order = (await createOrder(learner)).body.data.order as { reference: string };
    const body = chargeSuccess(order.reference, 500000);
    const res = await postWebhook(body, 'forged');
    expect(res.status).toBe(403);
  });

  it('marks the order paid once for a valid signed webhook', async () => {
    const order = (await createOrder(learner)).body.data.order as { id: string; reference: string };
    const body = chargeSuccess(order.reference, 500000);
    const first = await postWebhook(body, sign(body));
    expect(first.status).toBe(200);
    const replay = await postWebhook(body, sign(body));
    expect(replay.body.data.duplicate).toBe(true);
    const saved = await prisma.paymentOrder.findUniqueOrThrow({ where: { id: order.id } });
    expect(saved.status).toBe('PAID');
    expect(await prisma.paymentEvent.count({ where: { orderId: order.id } })).toBe(1);
  });

  it('ignores a signed webhook whose amount does not match', async () => {
    const order = (await createOrder(learner)).body.data.order as { id: string; reference: string };
    const body = chargeSuccess(order.reference, 100);
    const res = await postWebhook(body, sign(body));
    expect(res.body.data).toMatchObject({ ignored: true, reason: 'amount_mismatch' });
    const saved = await prisma.paymentOrder.findUniqueOrThrow({ where: { id: order.id } });
    expect(saved.status).toBe('PENDING');
  });

  it('fails closed when no Paystack secret is configured', async () => {
    process.env.PAYSTACK_SECRET_KEY = '';
    const body = chargeSuccess('xsp_anything', 500000);
    const res = await postWebhook(body, sign(body));
    process.env.PAYSTACK_SECRET_KEY = SECRET;
    expect(res.status).toBe(503);
  });
});
