import type { LoggerService } from '@nestjs/common';
import pino from 'pino';

import { redactPii } from './redact';

type Level = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';

/** Nest LoggerService backed by Pino. Every message passes through PII redaction. */
export class PinoLogger implements LoggerService {
  private readonly pino = pino({
    level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'test' ? 'warn' : 'info'),
    base: { service: 'examspring-api' },
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        '*.password',
        '*.token',
        '*.email',
      ],
      censor: '[REDACTED]',
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  });

  log(message: unknown, ...optional: unknown[]): void {
    this.write('info', message, optional);
  }

  error(message: unknown, ...optional: unknown[]): void {
    this.write('error', message, optional);
  }

  warn(message: unknown, ...optional: unknown[]): void {
    this.write('warn', message, optional);
  }

  debug(message: unknown, ...optional: unknown[]): void {
    this.write('debug', message, optional);
  }

  verbose(message: unknown, ...optional: unknown[]): void {
    this.write('trace', message, optional);
  }

  fatal(message: unknown, ...optional: unknown[]): void {
    this.write('fatal', message, optional);
  }

  /** Nest passes the context name last; errors may pass a stack before it. */
  private write(level: Level, message: unknown, optional: unknown[]): void {
    const context = typeof optional.at(-1) === 'string' ? optional.at(-1) : undefined;
    const stack = optional.length > 1 && typeof optional[0] === 'string' ? optional[0] : undefined;
    const clean = redactPii(message);
    const fields = { context, ...(stack ? { stack: redactPii(stack) } : {}) };
    if (typeof clean === 'object' && clean !== null) {
      this.pino[level]({ ...fields, ...clean });
    } else {
      this.pino[level](fields, String(clean));
    }
  }
}
