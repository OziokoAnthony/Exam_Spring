import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

import { loadEnv } from './config/env';

const BODY_LIMIT = '100kb';

export function configureApp(app: NestExpressApplication): void {
  app.set('trust proxy', 1);
  app.setGlobalPrefix('v1');
  app.useBodyParser('json', { limit: BODY_LIMIT });
  app.use(cookieParser());
  app.use(helmet());
  app.enableCors({ origin: loadEnv().WEB_ORIGIN, credentials: true });
}
