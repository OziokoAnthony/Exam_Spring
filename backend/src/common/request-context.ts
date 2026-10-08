import { Injectable, Logger } from '@nestjs/common';
import type { NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

type RequestWithId = Request & { id?: string };

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestContextMiddleware.name);

  use(req: Request, res: Response, next: NextFunction): void {
    const startedAt = process.hrtime.bigint();
    const request = req as RequestWithId; // Express' Request type has no `id` field
    request.id ??= randomUUID();
    res.setHeader('x-request-id', request.id);
    res.on('finish', () => {
      const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
      this.logger.log(
        `method=${req.method} path=${req.path} statusCode=${res.statusCode} durationMs=${durationMs.toFixed(1)} requestId=${request.id ?? ''}`,
      );
    });
    next();
  }
}
