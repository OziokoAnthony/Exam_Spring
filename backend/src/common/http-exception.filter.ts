import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { Catch, HttpException, HttpStatus, Logger } from '@nestjs/common';
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
    this.logger.error(
      'Unhandled error',
      exception instanceof Error ? exception.stack : String(exception),
    );
    res
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json(fail('INTERNAL_ERROR', 'Something went wrong'));
  }
}
