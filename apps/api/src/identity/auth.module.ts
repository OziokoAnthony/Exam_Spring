import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OutboxModule } from '../outbox/outbox.module';

@Module({
  imports: [JwtModule.register({}), OutboxModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
