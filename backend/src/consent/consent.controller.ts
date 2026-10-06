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
import { getAuthUser, JwtAuthGuard } from '../common/jwt-auth.guard';
import { ok } from '../common/envelope';
import { ZodPipe } from '../common/zod.pipe';

const InviteSchema = z.object({ learnerId: z.string().uuid(), guardianEmail: z.string().email() });
const ApproveSchema = z.object({
  token: z.string().min(1),
  guardianName: z.string().min(1),
  relationship: z.enum(['MOTHER', 'FATHER', 'GUARDIAN', 'OTHER']),
});

@Controller('consent')
export class ConsentController {
  constructor(@Inject(ConsentService) private readonly consent: ConsentService) {}

  @Post('guardian-invite')
  @UseGuards(JwtAuthGuard)
  async invite(
    @Body(new ZodPipe(InviteSchema)) dto: z.infer<typeof InviteSchema>,
    @Req() req: Request,
  ) {
    await this.consent.inviteGuardian(getAuthUser(req).id, dto.learnerId, dto.guardianEmail);
    return ok({ sent: true });
  }

  @Post('guardian-approve')
  @HttpCode(HttpStatus.OK)
  async approve(@Body(new ZodPipe(ApproveSchema)) dto: z.infer<typeof ApproveSchema>) {
    await this.consent.approveGuardian(dto.token, dto.guardianName, dto.relationship);
    return ok({ approved: true });
  }
}
