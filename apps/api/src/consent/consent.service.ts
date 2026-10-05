import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';

import type { PrismaClient } from '@examspring/db';

import { PRISMA } from '../database/database.module';
import { OutboxService } from '../outbox/outbox.service';

const INVITE_TTL = '7d';

@Injectable()
export class ConsentService {
  constructor(
    @Inject(PRISMA) private readonly prisma: PrismaClient,
    @Inject(JwtService) private readonly jwt: JwtService,
    @Inject(OutboxService) private readonly outbox: OutboxService,
  ) {}

  async inviteGuardian(actorId: string, learnerId: string, guardianEmail: string): Promise<void> {
    const learner = await this.prisma.user.findUnique({ where: { id: learnerId } });
    if (!learner || learner.role !== 'LEARNER')
      throw new UnauthorizedException('Learner not found');
    if (actorId !== learnerId) throw new UnauthorizedException('Not allowed');
    const token = this.jwt.sign(
      { type: 'guardian-invite', learnerId, guardianEmail },
      { secret: process.env.JWT_REFRESH_SECRET ?? 'dev', expiresIn: INVITE_TTL },
    );
    await this.outbox.enqueueEmail(
      guardianEmail,
      'Consent requested for ExamSpring',
      'guardian-invite',
      {
        learnerName: learner.fullName,
        token,
      },
      learnerId,
    );
  }

  async approveGuardian(
    token: string,
    guardianName: string,
    relationship: 'MOTHER' | 'FATHER' | 'GUARDIAN' | 'OTHER',
  ): Promise<void> {
    let payload: { type?: string; learnerId?: string; guardianEmail?: string };
    try {
      payload = this.jwt.verify(token, { secret: process.env.JWT_REFRESH_SECRET ?? 'dev' });
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
    if (payload.type !== 'guardian-invite' || !payload.learnerId || !payload.guardianEmail) {
      throw new UnauthorizedException('Invalid token');
    }
    const email = payload.guardianEmail;
    const guardian = await this.prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        fullName: guardianName,
        role: 'PARENT',
        passwordHash: randomBytes(32).toString('hex'),
      },
    });
    await this.prisma.guardianLink.upsert({
      where: { guardianId_learnerId: { guardianId: guardian.id, learnerId: payload.learnerId } },
      update: { status: 'ACTIVE', verifiedAt: new Date(), relationship },
      create: {
        guardianId: guardian.id,
        learnerId: payload.learnerId,
        relationship,
        status: 'ACTIVE',
        verifiedAt: new Date(),
      },
    });
    await this.prisma.consentRecord.create({
      data: {
        userId: payload.learnerId,
        guardianId: guardian.id,
        consentType: 'DATA_PROCESSING',
        grantedAt: new Date(),
        evidence: { method: 'email-token' },
        policyVersion: '2026-10-v1',
      },
    });
    await this.outbox.enqueueEmail(
      email,
      'Thanks for approving consent',
      'guardian-approved',
      { guardianName },
      guardian.id,
    );
  }
}
