import 'dotenv/config';
import './instrument';

import * as Sentry from '@sentry/nestjs';

import { PinoLogger } from './common/logger';

/** `pnpm --filter @examspring/api sentry:test` — Sprint 1 acceptance: Sentry captures a test error. */
async function main(): Promise<void> {
  const logger = new PinoLogger();
  if (!process.env.SENTRY_DSN) {
    logger.error('SENTRY_DSN is not set; nothing was sent', 'SentryTest');
    process.exitCode = 1;
    return;
  }
  const eventId = Sentry.captureException(new Error('ExamSpring Sentry test error'));
  await Sentry.flush(5000);
  logger.log({ msg: 'Sentry test event sent', eventId }, 'SentryTest');
}

void main();
