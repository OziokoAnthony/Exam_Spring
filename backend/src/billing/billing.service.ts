import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { Prisma } from '@examspring/db';
import type { PrismaClient } from '@examspring/db';
import { z } from 'zod';

import { PRISMA } from '../database/database.module';

export type Plan = 'MONTHLY' | 'TERM' | 'ANNUAL';

const PLAN_AMOUNT_KOBO: Record<Plan, number> = {
  MONTHLY: 500000,
  TERM: 1200000,
  ANNUAL: 4000000,
};

const WebhookPayloadSchema = z
  .object({
    event: z.string(),
    data: z
      .object({
        id: z.union([z.string(), z.number()]),
        reference: z.string(),
      })
      .passthrough(),
  })
  .passthrough();

@Injectable()
export class BillingService {
  constructor(@Inject(PRISMA) private readonly prisma: PrismaClient) {}

  async createOrder(userId: string, plan: Plan) {
    const reference = `xsp_${randomUUID()}`;
    const order = await this.prisma.paymentOrder.create({
      data: {
        userId,
        plan,
        amountKobo: PLAN_AMOUNT_KOBO[plan],
        currency: 'NGN',
        status: 'PENDING',
        reference,
      },
    });
    const authorizationUrl = await this.initializeTransaction(
      userId,
      order.reference,
      order.amountKobo,
    );
    return { order, authorizationUrl };
  }

  async getOrder(id: string, user: { id: string; role: string }) {
    const order = await this.prisma.paymentOrder.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== user.id && user.role !== 'ADMIN') {
      throw new ForbiddenException('Not your order');
    }
    return order;
  }

  async handlePaystackWebhook(body: unknown, signature: string | undefined) {
    // NOTE: Nest is configured with parsed JSON globally, so we verify the
    // HMAC-SHA512 of JSON.stringify(body) rather than the raw request bytes.
    // In production prefer a raw-body parser (express json `verify`) so the
    // signature is computed over the exact payload Paystack sent.
    const secret = process.env.PAYSTACK_SECRET_KEY ?? '';
    if (secret) {
      const expected = createHmac('sha512', secret).update(JSON.stringify(body)).digest('hex');
      const received = signature ?? '';
      const a = Buffer.from(expected);
      const b = Buffer.from(received);
      if (a.length !== b.length || !timingSafeEqual(a, b)) {
        throw new ForbiddenException('Invalid signature');
      }
    }

    const parsed = WebhookPayloadSchema.safeParse(body);
    if (!parsed.success) return { received: true, ignored: true };
    const { event, data } = parsed.data;
    if (event !== 'charge.success') return { received: true, ignored: true };

    const order = await this.prisma.paymentOrder.findUnique({
      where: { reference: data.reference },
    });
    if (!order) return { received: true, ignored: true };

    try {
      await this.prisma.$transaction([
        this.prisma.paymentEvent.create({
          data: {
            orderId: order.id,
            provider: 'paystack',
            providerEventId: String(data.id),
            payload: body as Prisma.InputJsonValue,
          },
        }),
        this.prisma.paymentOrder.update({
          where: { id: order.id },
          data: { status: 'PAID', paidAt: new Date() },
        }),
      ]);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        return { received: true, duplicate: true };
      }
      throw err;
    }
    return { received: true };
  }

  private async initializeTransaction(userId: string, reference: string, amountKobo: number) {
    const secret = process.env.PAYSTACK_SECRET_KEY ?? '';
    if (!secret) return `https://checkout.paystack.com/mock/${reference}`;

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const res = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: user.email, amount: amountKobo, reference }),
    });
    const json = (await res.json()) as { status?: boolean; data?: { authorization_url?: string } };
    const url = json.data?.authorization_url;
    if (!res.ok || !url) throw new Error('Paystack initialize failed');
    return url;
  }
}
