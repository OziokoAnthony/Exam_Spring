import { Module } from '@nestjs/common';

import { EmailService } from '../mail/email.service';
import { OutboxService } from './outbox.service';

@Module({
  providers: [EmailService, OutboxService],
  exports: [EmailService, OutboxService],
})
export class OutboxModule {}
