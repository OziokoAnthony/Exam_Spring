import 'dotenv/config';
import './instrument';
import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module';
import { configureApp } from './bootstrap';
import { PinoLogger } from './common/logger';
import { loadEnv } from './config/env';

async function bootstrap(): Promise<void> {
  const logger = new PinoLogger();
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
    bufferLogs: true,
  });
  app.useLogger(logger);
  app.enableShutdownHooks();
  configureApp(app);
  const port = loadEnv().API_PORT;
  await app.listen(port);
  logger.log({ msg: 'API listening', port }, 'Bootstrap');
}

void bootstrap();
