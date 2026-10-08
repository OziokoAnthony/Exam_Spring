import 'reflect-metadata';

import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import express, { type Express } from 'express';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';

import { AppModule } from '../src/app.module';
import { loadEnv } from '../src/config/env';

let app: Express | undefined;

async function bootstrap(): Promise<Express> {
  if (app) return app;
  const server = express();
  const nest = await NestFactory.create(AppModule, new ExpressAdapter(server));
  nest.setGlobalPrefix('v1');
  nest.use(cookieParser());
  nest.use(helmet());
  nest.enableCors({ origin: loadEnv().WEB_ORIGIN, credentials: true });
  await nest.init();
  app = server;
  return app;
}

const handler: express.Handler = (_req, res, next) => {
  bootstrap()
    .then((a) => a(_req, res, next))
    .catch(next);
};

export default handler;
