import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  Inject,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { HTTP_CODE_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { createHash } from 'node:crypto';
import type { Request, Response } from 'express';
import type Redis from 'ioredis';
import { from, of, switchMap, tap, catchError, throwError } from 'rxjs';
import type { Observable } from 'rxjs';
import { z } from 'zod';

import { REDIS } from '../redis/redis.module';

const HEADER = 'idempotency-key';
const KEY_FORMAT = /^[A-Za-z0-9_-]{8,100}$/;
const IN_FLIGHT_TTL_S = 60;
const RESULT_TTL_S = 24 * 60 * 60;
const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
/** Webhooks carry their own provider event ids. */
const EXCLUDED_PATHS = ['/v1/billing/webhooks/'];

const StoredSchema = z.discriminatedUnion('state', [
  z.object({ state: z.literal('pending'), bodyHash: z.string() }),
  z.object({
    state: z.literal('done'),
    bodyHash: z.string(),
    status: z.number().int(),
    body: z.unknown(),
  }),
]);

type Stored = z.infer<typeof StoredSchema>;
type CachedResult = { status: number; body: unknown };

function hashBody(body: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(body ?? null))
    .digest('hex');
}

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(
    @Inject(REDIS) private readonly redis: Redis,
    @Inject(Reflector) private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request & { user?: { id: string } }>();
    const header = req.headers[HEADER];
    const key = Array.isArray(header) ? header[0] : header;
    if (!key || !MUTATING.has(req.method) || EXCLUDED_PATHS.some((p) => req.path.startsWith(p))) {
      return next.handle();
    }
    if (!KEY_FORMAT.test(key)) throw new BadRequestException('Invalid Idempotency-Key');
    const scope = req.user?.id ?? `ip:${req.ip ?? 'unknown'}`;
    const redisKey = `idem:${scope}:${req.method}:${req.path}:${key}`;
    const bodyHash = hashBody(req.body);
    const status = this.successStatus(context, req.method);
    return from(this.claim(redisKey, bodyHash)).pipe(
      switchMap((cached) => {
        if (cached) {
          context.switchToHttp().getResponse<Response>().status(cached.status);
          return of(cached.body);
        }
        return next.handle().pipe(
          tap((body) => {
            const stored: Stored = { state: 'done', bodyHash, status, body };
            void this.redis.set(redisKey, JSON.stringify(stored), 'EX', RESULT_TTL_S);
          }),
          catchError((err: unknown) => {
            void this.redis.del(redisKey);
            return throwError(() => err);
          }),
        );
      }),
    );
  }

  /** Returns a cached result, or null after reserving the key for this request. */
  private async claim(redisKey: string, bodyHash: string): Promise<CachedResult | null> {
    const pending: Stored = { state: 'pending', bodyHash };
    const reserved = await this.redis.set(
      redisKey,
      JSON.stringify(pending),
      'EX',
      IN_FLIGHT_TTL_S,
      'NX',
    );
    if (reserved === 'OK') return null;
    const raw = await this.redis.get(redisKey);
    if (!raw) return this.claim(redisKey, bodyHash);
    const parsed = StoredSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) throw new ConflictException('Request already in progress');
    const existing = parsed.data;
    if (existing.bodyHash !== bodyHash) {
      throw new UnprocessableEntityException('Idempotency-Key reused with a different request');
    }
    if (existing.state === 'pending') throw new ConflictException('Request already in progress');
    return { status: existing.status, body: existing.body };
  }

  private successStatus(context: ExecutionContext, method: string): number {
    const explicit = this.reflector.get<number | undefined>(
      HTTP_CODE_METADATA,
      context.getHandler(),
    );
    return explicit ?? (method === 'POST' ? HttpStatus.CREATED : HttpStatus.OK);
  }
}
