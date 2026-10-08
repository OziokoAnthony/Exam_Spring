import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';

@Module({
  imports: [JwtModule.register({})],
  controllers: [ReportsController],
  providers: [ReportsService, JwtAuthGuard],
})
export class ReportsModule {}
