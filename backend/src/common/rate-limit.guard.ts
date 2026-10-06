import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Inject, Injectable, SetMetadata, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import type Redis from 'ioredis';

import { REDIS } from '../redis/redis.module';

const RATE_LIMIT_KEY = 'rate-limit';

export function RateLimit(limit: number, windowSeconds: number): MethodDecorator {
  return SetMetadata(RATE_LIMIT_KEY, { limit, windowSeconds });
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(REDIS) private readonly redis: Redis,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const cfg = this.reflector.get<{ limit: number; windowSeconds: number } | undefined>(
      RATE_LIMIT_KEY,
      context.getHandler(),
    );
    if (!cfg) return true;
    const req = context.switchToHttp().getRequest<Request>();
    const key = `rl:${req.ip ?? 'unknown'}:${req.route?.path ?? req.url}`;
    const count = await this.redis.incr(key);
    if (count === 1) await this.redis.expire(key, cfg.windowSeconds);
    if (count > cfg.limit) {
      const res = context.switchToHttp().getResponse<Response>();
      res.setHeader('Retry-After', cfg.windowSeconds);
      throw new HttpException('Too many requests', HttpStatus.TOO_MANY_REQUESTS);
    }
    return true;
  }
}
