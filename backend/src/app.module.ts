import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';

import { RateLimitGuard } from './common/rate-limit.guard';
import { GlobalExceptionFilter } from './common/http-exception.filter';
import { DatabaseModule } from './database/database.module';
import { HealthController } from './health.controller';
import { AuthModule } from './identity/auth.module';
import { ParentModule } from './parent/parent.module';
import { TeacherModule } from './teacher/teacher.module';
import { AttemptsModule } from './attempts/attempts.module';
import { ConsentModule } from './consent/consent.module';
import { QuestionsModule } from './questions/questions.module';
import { CurriculumModule } from './curriculum/curriculum.module';
import { OutboxModule } from './outbox/outbox.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    DatabaseModule,
    RedisModule,
    OutboxModule,
    AuthModule,
    ConsentModule,
    QuestionsModule,
    AttemptsModule,
    CurriculumModule,
    ParentModule,
    TeacherModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: RateLimitGuard },
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
  ],
})
export class AppModule {}
