import {
  BadGatewayException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
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

const InitializeResponseSchema = z.object({
  status: z.boolean(),
  data: z.object({ authorization_url: z.string().url() }),
});

const PAYSTACK_TIMEOUT_MS = 10_000;

function paystackSecret(): string {
  return process.env.PAYSTACK_SECRET_KEY ?? '';
}

/** Constant-time HMAC-SHA512 check over the exact bytes Paystack sent. */
export function isValidPaystackSignature(
  rawBody: Buffer,
  signature: string | undefined,
  secret: string,
): boolean {
  const expected = Buffer.from(createHmac('sha512', secret).update(rawBody).digest('hex'));
  const received = Buffer.from(signature ?? '');
  return expected.length === received.length && timingSafeEqual(expected, received);
}

const WebhookPayloadSchema = z
  .object({
    event: z.string(),
    data: z
      .object({
        id: z.union([z.string(), z.number()]),
        reference: z.string(),
        amount: z.number().int(),
        currency: z.string(),
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

  async handlePaystackWebhook(rawBody: Buffer | undefined, signature: string | undefined) {
    const secret = paystackSecret();
    if (!secret) throw new ServiceUnavailableException('Payments are not configured');
    if (!rawBody || !isValidPaystackSignature(rawBody, signature, secret)) {
      throw new ForbiddenException('Invalid signature');
    }
    const body: unknown = JSON.parse(rawBody.toString('utf8'));
    const parsed = WebhookPayloadSchema.safeParse(body);
    if (!parsed.success) return { received: true, ignored: true };
    const { event, data } = parsed.data;
    if (event !== 'charge.success') return { received: true, ignored: true };

    const order = await this.prisma.paymentOrder.findUnique({
      where: { reference: data.reference },
    });
    if (!order) return { received: true, ignored: true };
    if (data.amount !== order.amountKobo || data.currency !== order.currency) {
      return { received: true, ignored: true, reason: 'amount_mismatch' };
    }
    return this.recordPayment(order.id, String(data.id), body);
  }

  private async recordPayment(orderId: string, providerEventId: string, body: unknown) {
    try {
      await this.prisma.$transaction([
        this.prisma.paymentEvent.create({
          data: {
            orderId,
            provider: 'paystack',
            providerEventId,
            payload: body as Prisma.InputJsonValue,
          },
        }),
        this.prisma.paymentOrder.updateMany({
          where: { id: orderId, status: 'PENDING' },
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
    const secret = paystackSecret();
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
      signal: AbortSignal.timeout(PAYSTACK_TIMEOUT_MS),
    });
    const parsed = InitializeResponseSchema.safeParse(await res.json());
    if (!res.ok || !parsed.success || !parsed.data.status) {
      throw new BadGatewayException('Payment provider unavailable');
    }
    return parsed.data.data.authorization_url;
  }
}
