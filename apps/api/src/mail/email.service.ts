import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

const FROM = process.env.EMAIL_FROM ?? 'ExamSpring <noreply@examspring.local>';

@Injectable()
export class EmailService {
  private readonly logger = new Logger('EmailService');
  private readonly resend: Resend | null;

  constructor() {
    this.resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
  }

  async send(to: string, subject: string, html: string): Promise<void> {
    if (!this.resend) {
      this.logger.log(`Email skipped (no RESEND_API_KEY): ${subject}`);
      return;
    }
    await this.resend.emails.send({ from: FROM, to, subject, html });
  }
}
