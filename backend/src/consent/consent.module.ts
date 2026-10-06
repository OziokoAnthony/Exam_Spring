import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { ConsentController } from './consent.controller';
import { ConsentService } from './consent.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { OutboxModule } from '../outbox/outbox.module';

@Module({
  imports: [JwtModule.register({}), OutboxModule],
  controllers: [ConsentController],
  providers: [ConsentService, JwtAuthGuard],
})
export class ConsentModule {}
