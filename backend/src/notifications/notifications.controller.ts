import { Body, Controller, Get, Inject, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { z } from 'zod';

import { ok } from '../common/envelope';
import { getAuthUser, JwtAuthGuard } from '../common/jwt-auth.guard';
import { ZodPipe } from '../common/zod.pipe';
import { ForbiddenException } from '@nestjs/common';

import { NotificationsService } from './notifications.service';

const EmailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1).max(200),
  template: z.string().min(1),
  data: z.record(z.string()).default({}),
});

@Controller('notifications')
export class NotificationsController {
  constructor(@Inject(NotificationsService) private readonly svc: NotificationsService) {}

  @Get('outbox')
  @UseGuards(JwtAuthGuard)
  async outbox(@Req() req: Request) {
    if (getAuthUser(req).role !== 'ADMIN') throw new ForbiddenException();
    return ok(await this.svc.recentOutbox());
  }

  @Post('email')
  @UseGuards(JwtAuthGuard)
  async send(
    @Body(new ZodPipe(EmailSchema)) dto: z.infer<typeof EmailSchema>,
    @Req() req: Request,
  ) {
    if (getAuthUser(req).role !== 'ADMIN') throw new ForbiddenException();
    return ok(await this.svc.enqueueEmail(dto));
  }
}
