import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';

@Module({
  imports: [JwtModule.register({})],
  controllers: [BillingController],
  providers: [BillingService, JwtAuthGuard],
  exports: [BillingService],
})
export class BillingModule {}
