import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AttemptsController } from './attempts.controller';
import { AttemptsService } from './attempts.service';
import { PracticeService } from './practice.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';

@Module({
  imports: [JwtModule.register({})],
  controllers: [AttemptsController],
  providers: [AttemptsService, PracticeService, JwtAuthGuard],
})
export class AttemptsModule {}
