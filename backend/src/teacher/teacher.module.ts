import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { TeacherController } from './teacher.controller';
import { JwtAuthGuard } from '../common/jwt-auth.guard';

@Module({
  imports: [JwtModule.register({})],
  controllers: [TeacherController],
  providers: [JwtAuthGuard],
})
export class TeacherModule {}
