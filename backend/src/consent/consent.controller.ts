import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { z } from 'zod';

import { ConsentService } from './consent.service';
import { AllowPendingConsent, getAuthUser, JwtAuthGuard } from '../common/jwt-auth.guard';
import { ok } from '../common/envelope';
import { RateLimit } from '../common/rate-limit.guard';
import { ZodPipe } from '../common/zod.pipe';

const InviteSchema = z.object({
  learnerId: z.string().uuid(),
  guardianEmail: z.string().email().max(255),
});
const ApproveSchema = z.object({
  token: z.string().min(1).max(2000),
  guardianEmail: z.string().email().max(255),
  guardianName: z.string().min(1).max(120),
  relationship: z.enum(['MOTHER', 'FATHER', 'GUARDIAN', 'OTHER']),
});
const RevokeSchema = z.object({ learnerId: z.string().uuid() });

@Controller('consent')
export class ConsentController {
  constructor(@Inject(ConsentService) private readonly consent: ConsentService) {}

  @Post('guardian-invite')
  @UseGuards(JwtAuthGuard)
  @AllowPendingConsent()
  @RateLimit(3, 300)
  async invite(
    @Body(new ZodPipe(InviteSchema)) dto: z.infer<typeof InviteSchema>,
    @Req() req: Request,
  ) {
    await this.consent.inviteGuardian(getAuthUser(req).id, dto.learnerId, dto.guardianEmail);
    return ok({ sent: true });
  }

  @Post('guardian-approve')
  @HttpCode(HttpStatus.OK)
  @RateLimit(5, 60)
  async approve(
    @Body(new ZodPipe(ApproveSchema)) dto: z.infer<typeof ApproveSchema>,
    @Req() req: Request,
  ) {
    await this.consent.approveGuardian(dto, { ip: req.ip, userAgent: req.headers['user-agent'] });
    return ok({ approved: true });
  }

  @Post('revoke')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async revoke(
    @Body(new ZodPipe(RevokeSchema)) dto: z.infer<typeof RevokeSchema>,
    @Req() req: Request,
  ) {
    await this.consent.revoke(getAuthUser(req).id, dto.learnerId);
    return ok({ revoked: true });
  }
}
