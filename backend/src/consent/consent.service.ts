import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'crypto';

import type { PrismaClient } from '@examspring/db';

import { loadEnv } from '../config/env';
import { PRISMA } from '../database/database.module';
import { OutboxService } from '../outbox/outbox.service';

const INVITE_TTL = '7d';
const POLICY_VERSION = '2026-10-v1';

export type GuardianRelationship = 'MOTHER' | 'FATHER' | 'GUARDIAN' | 'OTHER';

export type ApproveInput = {
  token: string;
  guardianEmail: string;
  guardianName: string;
  relationship: GuardianRelationship;
};

export type RequestEvidence = { ip?: string | undefined; userAgent?: string | undefined };

type InvitePayload = { type?: string; learnerId?: string; gh?: string };

function emailHash(email: string): string {
  return createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
}

function evidenceJson(evidence: RequestEvidence) {
  return {
    method: 'email-token',
    ip: evidence.ip ?? null,
    userAgent: evidence.userAgent?.slice(0, 200) ?? null,
    timestamp: new Date().toISOString(),
    policyVersion: POLICY_VERSION,
  };
}

@Injectable()
export class ConsentService {
  constructor(
    @Inject(PRISMA) private readonly prisma: PrismaClient,
    @Inject(JwtService) private readonly jwt: JwtService,
    @Inject(OutboxService) private readonly outbox: OutboxService,
  ) {}

  async inviteGuardian(actorId: string, learnerId: string, guardianEmail: string): Promise<void> {
    if (actorId !== learnerId) throw new ForbiddenException('Not allowed');
    const learner = await this.prisma.user.findUnique({ where: { id: learnerId } });
    if (!learner || learner.role !== 'LEARNER') throw new NotFoundException('Learner not found');
    if (learner.status !== 'PENDING_GUARDIAN_CONSENT') {
      throw new ConflictException('Consent is not pending for this learner');
    }
    await this.sendInvite(learner, guardianEmail);
  }

  /** Issues a 7-day invite. Usable once: approval moves the learner out of PENDING. */
  async sendInvite(
    learner: { id: string; email: string; fullName: string },
    guardianEmail: string,
  ): Promise<void> {
    if (emailHash(guardianEmail) === emailHash(learner.email)) {
      throw new BadRequestException('Guardian email must differ from the learner email');
    }
    const token = this.jwt.sign(
      { type: 'guardian-invite', learnerId: learner.id, gh: emailHash(guardianEmail) },
      { secret: loadEnv().JWT_REFRESH_SECRET, expiresIn: INVITE_TTL },
    );
    await this.outbox.enqueueEmail(
      guardianEmail,
      'Consent requested for ExamSpring',
      'guardian-invite',
      { learnerName: learner.fullName, token },
      learner.id,
    );
  }

  async approveGuardian(input: ApproveInput, evidence: RequestEvidence): Promise<void> {
    const learnerId = this.verifyInvite(input.token, input.guardianEmail);
    const learner = await this.prisma.user.findUnique({ where: { id: learnerId } });
    if (!learner || learner.status !== 'PENDING_GUARDIAN_CONSENT') {
      throw new UnauthorizedException('Invite already used or no longer valid');
    }
    const email = input.guardianEmail.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing && existing.role !== 'PARENT') {
      throw new ConflictException('This email belongs to a non-guardian account');
    }
    const guardianId = await this.recordApproval({
      learnerId,
      email,
      existingGuardianId: existing?.id,
      input,
      evidence,
    });
    await this.outbox.enqueueEmail(
      email,
      'Thanks for approving consent',
      'guardian-approved',
      { guardianName: input.guardianName },
      guardianId,
    );
  }

  /** Guardian withdraws consent: record revoked, learner suspended (SKILL.md 8.4 step 4). */
  async revoke(guardianId: string, learnerId: string): Promise<void> {
    const link = await this.prisma.guardianLink.findFirst({
      where: { guardianId, learnerId, status: 'ACTIVE' },
    });
    if (!link) throw new ForbiddenException('Not your learner');
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.consentRecord.updateMany({
        where: { userId: learnerId, guardianId, revokedAt: null },
        data: { revokedAt: now },
      }),
      this.prisma.guardianLink.update({ where: { id: link.id }, data: { status: 'REVOKED' } }),
      this.prisma.user.update({ where: { id: learnerId }, data: { status: 'SUSPENDED' } }),
      this.prisma.session.updateMany({
        where: { userId: learnerId, revokedAt: null },
        data: { revokedAt: now },
      }),
    ]);
  }

  private async recordApproval(args: {
    learnerId: string;
    email: string;
    existingGuardianId: string | undefined;
    input: ApproveInput;
    evidence: RequestEvidence;
  }): Promise<string> {
    const { learnerId, email, existingGuardianId, input, evidence } = args;
    return this.prisma.$transaction(async (tx) => {
      const guardianId =
        existingGuardianId ??
        (
          await tx.user.create({
            data: {
              email,
              fullName: input.guardianName,
              role: 'PARENT',
              passwordHash: randomBytes(32).toString('hex'),
              emailVerifiedAt: new Date(),
            },
          })
        ).id;
      const link = {
        status: 'ACTIVE' as const,
        verifiedAt: new Date(),
        relationship: input.relationship,
      };
      await tx.guardianLink.upsert({
        where: { guardianId_learnerId: { guardianId, learnerId } },
        update: link,
        create: { guardianId, learnerId, ...link },
      });
      await tx.consentRecord.create({
        data: {
          userId: learnerId,
          guardianId,
          consentType: 'DATA_PROCESSING',
          grantedAt: new Date(),
          evidence: evidenceJson(evidence),
          policyVersion: POLICY_VERSION,
        },
      });
      await tx.user.update({ where: { id: learnerId }, data: { status: 'ACTIVE' } });
      return guardianId;
    });
  }

  private verifyInvite(token: string, guardianEmail: string): string {
    let payload: InvitePayload;
    try {
      payload = this.jwt.verify<InvitePayload>(token, { secret: loadEnv().JWT_REFRESH_SECRET });
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
    if (payload.type !== 'guardian-invite' || !payload.learnerId || !payload.gh) {
      throw new UnauthorizedException('Invalid token');
    }
    if (payload.gh !== emailHash(guardianEmail)) {
      throw new UnauthorizedException('Email does not match the invite');
    }
    return payload.learnerId;
  }
}
