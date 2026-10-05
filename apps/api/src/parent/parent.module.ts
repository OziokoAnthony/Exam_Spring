import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { ParentController } from './parent.controller';
import { JwtAuthGuard } from '../common/jwt-auth.guard';

@Module({
  imports: [JwtModule.register({})],
  controllers: [ParentController],
  providers: [JwtAuthGuard],
})
export class ParentModule {}
