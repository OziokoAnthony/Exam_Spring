import { Global, Module } from '@nestjs/common';
import Redis from 'ioredis';

import { loadEnv } from '../config/env';

export const REDIS = 'REDIS';

@Global()
@Module({
  providers: [
    {
      provide: REDIS,
      useFactory: () => new Redis(loadEnv().REDIS_URL, { lazyConnect: true }),
    },
  ],
  exports: [REDIS],
})
export class RedisModule {}
