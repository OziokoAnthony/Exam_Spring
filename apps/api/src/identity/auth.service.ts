import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';

import type { PrismaClient } from '@examspring/db';
import type {
  LoginDto,
  ResetPasswordConfirmDto,
  ResetPasswordDto,
  SignupDto,
  VerifyEmailDto,
} from '@examspring/shared';

import { PRISMA } from '../database/database.module';
import { loadEnv } from '../config/env';
import { OutboxService } from '../outbox/outbox.service';

const BCRYPT_ROUNDS = 12;
const ACCESS_TTL = '15m';
const REFRESH_TTL_DAYS = 30;
const RESET_TTL_MS = 60 * 60 * 1000;

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function computeIsMinor(dob: string): boolean {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age < 18;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(PRISMA) private readonly prisma: PrismaClient,
    @Inject(JwtService) private readonly jwt: JwtService,
    @Inject(OutboxService) private readonly outbox: OutboxService,
  ) {}

  async signup(dto: SignupDto) {
    const birth = new Date(dto.dateOfBirth);
    const age = (Date.now() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    if (age < 5 || age > 100) throw new UnauthorizedException('Invalid date of birth');
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new UnauthorizedException('Unable to create account');
    }
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        role: dto.role,
        fullName: dto.fullName,
        dateOfBirth: birth,
        isMinor: computeIsMinor(dto.dateOfBirth),
      },
    });
    const verificationToken = this.signVerifyToken(user.id, user.email);
    await this.outbox.enqueueEmail(
      user.email,
      'Verify your ExamSpring email',
      'verify-email',
      { token: verificationToken },
      user.id,
    );
    return {
      user: this.publicUser(user),
      verificationToken: process.env.NODE_ENV === 'production' ? undefined : verificationToken,
    };
  }

  async login(dto: LoginDto, userAgent?: string, ip?: string) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Invalid credentials');
    }
    const matches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!matches) throw new UnauthorizedException('Invalid credentials');
    const tokens = await this.issueTokens(user.id, user.role, userAgent, ip);
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    return { user: this.publicUser(user), ...tokens };
  }

  async refresh(refreshToken: string, userAgent?: string, ip?: string) {
    const hash = sha256(refreshToken);
    const session = await this.prisma.session.findUnique({ where: { refreshTokenHash: hash } });
    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const user = await this.prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) throw new UnauthorizedException('Invalid session');
    await this.prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });
    const tokens = await this.issueTokens(user.id, user.role, userAgent, ip);
    return { user: this.publicUser(user), ...tokens };
  }

  async logout(refreshToken: string): Promise<void> {
    const hash = sha256(refreshToken);
    await this.prisma.session.updateMany({
      where: { refreshTokenHash: hash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async requestPasswordReset(dto: ResetPasswordDto): Promise<{ devToken?: string }> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) return {};
    const token = randomBytes(32).toString('hex');
    await this.prisma.passwordReset.create({
      data: {
        userId: user.id,
        tokenHash: sha256(token),
        expiresAt: new Date(Date.now() + RESET_TTL_MS),
      },
    });
    await this.outbox.enqueueEmail(
      user.email,
      'Reset your ExamSpring password',
      'reset-password',
      { token },
      user.id,
    );
    return process.env.NODE_ENV === 'production' ? {} : { devToken: token };
  }

  async confirmPasswordReset(dto: ResetPasswordConfirmDto): Promise<void> {
    const reset = await this.prisma.passwordReset.findUnique({
      where: { tokenHash: sha256(dto.token) },
    });
    if (!reset || reset.usedAt || reset.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired token');
    }
    const passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    await this.prisma.$transaction([
      this.prisma.passwordReset.update({ where: { id: reset.id }, data: { usedAt: new Date() } }),
      this.prisma.user.update({ where: { id: reset.userId }, data: { passwordHash } }),
      this.prisma.session.updateMany({
        where: { userId: reset.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
  }

  async verifyEmail(dto: VerifyEmailDto): Promise<void> {
    const env = loadEnv();
    let payload: { sub?: string; type?: string };
    try {
      payload = this.jwt.verify(dto.token, { secret: env.JWT_REFRESH_SECRET });
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
    if (payload.type !== 'verify-email' || !payload.sub) {
      throw new UnauthorizedException('Invalid token');
    }
    await this.prisma.user.update({
      where: { id: payload.sub },
      data: { emailVerifiedAt: new Date() },
    });
  }

  private signVerifyToken(userId: string, email: string): string {
    const env = loadEnv();
    return this.jwt.sign(
      { type: 'verify-email', email },
      { secret: env.JWT_REFRESH_SECRET, expiresIn: '24h', subject: userId },
    );
  }

  private async issueTokens(userId: string, role: string, userAgent?: string, ip?: string) {
    const env = loadEnv();
    const accessToken = this.jwt.sign(
      { role },
      { secret: env.JWT_ACCESS_SECRET, expiresIn: ACCESS_TTL, subject: userId },
    );
    const refreshToken = randomBytes(48).toString('hex');
    await this.prisma.session.create({
      data: {
        userId,
        refreshTokenHash: sha256(refreshToken),
        deviceLabel: userAgent?.slice(0, 120) ?? null,
        ipAddress: ip ?? null,
        expiresAt: new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000),
        lastUsedAt: new Date(),
      },
    });
    return { accessToken, refreshToken, expiresIn: 900 };
  }

  private publicUser(user: {
    id: string;
    email: string;
    role: string;
    fullName: string;
    isMinor: boolean;
    emailVerifiedAt: Date | null;
  }) {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      isMinor: user.isMinor,
      emailVerified: user.emailVerifiedAt !== null,
    };
  }
}
