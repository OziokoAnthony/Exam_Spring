import 'reflect-metadata';

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('v1');
  const port = Number(process.env.API_PORT ?? 3001);
  await app.listen(port);
  new Logger('Bootstrap').log(`API listening on port ${port}`);
}

void bootstrap();
