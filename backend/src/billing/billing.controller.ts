import {
  Body,
  Controller,
  Get,
  Headers,
  Inject,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { z } from 'zod';

import { BillingService } from './billing.service';
import { getAuthUser, JwtAuthGuard } from '../common/jwt-auth.guard';
import { ok } from '../common/envelope';
import { ZodPipe } from '../common/zod.pipe';

const CreateOrderSchema = z.object({
  plan: z.enum(['MONTHLY', 'TERM', 'ANNUAL']),
});

@Controller('billing')
export class BillingController {
  constructor(@Inject(BillingService) private readonly billing: BillingService) {}

  @Post('orders')
  @UseGuards(JwtAuthGuard)
  async createOrder(
    @Body(new ZodPipe(CreateOrderSchema)) dto: z.infer<typeof CreateOrderSchema>,
    @Req() req: Request,
  ) {
    return ok(await this.billing.createOrder(getAuthUser(req).id, dto.plan));
  }

  @Get('orders/:id')
  @UseGuards(JwtAuthGuard)
  async getOrder(@Param('id') id: string, @Req() req: Request) {
    return ok(await this.billing.getOrder(id, getAuthUser(req)));
  }

  // Public endpoint — deliberately no JwtAuthGuard; authenticity is enforced
  // by the Paystack HMAC-SHA512 signature check in the service.
  @Post('webhooks/paystack')
  async webhook(@Body() body: unknown, @Headers('x-paystack-signature') signature?: string) {
    return ok(await this.billing.handlePaystackWebhook(body, signature));
  }
}
