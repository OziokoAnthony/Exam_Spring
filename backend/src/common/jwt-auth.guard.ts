import type { CanActivate, ExecutionContext } from '@nestjs/common';
import {
  ForbiddenException,
  Inject,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

import { loadEnv } from '../config/env';

export type AuthUser = { id: string; role: string; status: string };

const ALLOW_PENDING_KEY = 'allow-pending-consent';

/** Lets a minor awaiting guardian consent reach this route (SKILL.md 8.4). */
export function AllowPendingConsent(): MethodDecorator {
  return SetMetadata(ALLOW_PENDING_KEY, true);
}

export function getAuthUser(req: Request): AuthUser {
  const user = (req as Request & { user?: AuthUser }).user;
  if (!user) throw new UnauthorizedException('Unauthenticated');
  return user;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject(JwtService) private readonly jwt: JwtService,
    @Inject(Reflector) private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const user = this.verify(req);
    if (user.status === 'PENDING_GUARDIAN_CONSENT') {
      const allowPending = this.reflector.get<boolean | undefined>(
        ALLOW_PENDING_KEY,
        context.getHandler(),
      );
      if (!allowPending) {
        throw new ForbiddenException({
          code: 'CONSENT_PENDING',
          message: 'Guardian consent is required before using ExamSpring',
        });
      }
    } else if (user.status !== 'ACTIVE') {
      throw new ForbiddenException('Account is not active');
    }
    (req as Request & { user?: AuthUser }).user = user;
    return true;
  }

  private verify(req: Request): AuthUser {
    const header = req.headers.authorization ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!token) throw new UnauthorizedException('Missing token');
    try {
      const payload = this.jwt.verify<{ sub?: string; role?: string; status?: string }>(token, {
        secret: loadEnv().JWT_ACCESS_SECRET,
      });
      if (!payload.sub || !payload.role || !payload.status) throw new Error('bad payload');
      return { id: payload.sub, role: payload.role, status: payload.status };
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
