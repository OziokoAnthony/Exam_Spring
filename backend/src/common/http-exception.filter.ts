import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { Catch, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Prisma } from '@examspring/db';
import { isErrorCode } from '@examspring/shared';
import type { ErrorCode } from '@examspring/shared';
import type { Response } from 'express';

import { fail } from './envelope';

const CODE_BY_STATUS: Partial<Record<number, ErrorCode>> = {
  [HttpStatus.BAD_REQUEST]: 'VALIDATION_ERROR',
  [HttpStatus.UNAUTHORIZED]: 'UNAUTHENTICATED',
  [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
  [HttpStatus.CONFLICT]: 'CONFLICT',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'BUSINESS_RULE_VIOLATION',
  [HttpStatus.TOO_MANY_REQUESTS]: 'RATE_LIMITED',
};

/** Exceptions may carry an explicit envelope code, e.g. `{ code: 'CONSENT_PENDING' }`. */
function explicitCode(exception: HttpException): ErrorCode | undefined {
  const body = exception.getResponse();
  if (typeof body === 'object' && body !== null && 'code' in body) {
    const code: unknown = body.code;
    if (isErrorCode(code)) return code;
  }
  return undefined;
}

/** Maps expected Prisma failures to client errors instead of 500s. */
function prismaError(
  exception: unknown,
): { status: number; code: ErrorCode; message: string } | null {
  if (!(exception instanceof Prisma.PrismaClientKnownRequestError)) return null;
  if (exception.code === 'P2002') {
    return { status: HttpStatus.CONFLICT, code: 'CONFLICT', message: 'Already exists' };
  }
  if (exception.code === 'P2025') {
    return { status: HttpStatus.NOT_FOUND, code: 'NOT_FOUND', message: 'Not found' };
  }
  if (exception.code === 'P2003') {
    return {
      status: HttpStatus.BAD_REQUEST,
      code: 'VALIDATION_ERROR',
      message: 'Related record not found',
    };
  }
  return null;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const code = explicitCode(exception) ?? CODE_BY_STATUS[status] ?? 'INTERNAL_ERROR';
      res.status(status).json(fail(code, exception.message));
      return;
    }
    const mapped = prismaError(exception);
    if (mapped) {
      res.status(mapped.status).json(fail(mapped.code, mapped.message));
      return;
    }
    this.logger.error(
      'Unhandled error',
      exception instanceof Error ? exception.stack : String(exception),
    );
    res
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json(fail('INTERNAL_ERROR', 'Something went wrong'));
  }
}
