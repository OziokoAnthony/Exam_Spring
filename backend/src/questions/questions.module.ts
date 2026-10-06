import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { QuestionsController } from './questions.controller';
import { QuestionsService } from './questions.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';

@Module({
  imports: [JwtModule.register({})],
  controllers: [QuestionsController],
  providers: [QuestionsService, JwtAuthGuard],
  exports: [QuestionsService],
})
export class QuestionsModule {}
