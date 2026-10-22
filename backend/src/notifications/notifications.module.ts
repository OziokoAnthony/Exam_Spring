import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { OutboxModule } from '../outbox/outbox.module';
import { DatabaseModule } from '../database/database.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [JwtModule.register({}), DatabaseModule, OutboxModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, JwtAuthGuard],
})
export class NotificationsModule {}
