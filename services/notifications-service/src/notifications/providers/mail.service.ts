import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';

export interface VisitMailPayload {
  to?: string | null;
  subject: string;
  html: string;
  pdf?: Buffer;
  filename?: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter;
  private readonly defaultFrom: string;

  constructor(private readonly config: ConfigService) {
    const host = config.get<string>('SMTP_HOST', 'localhost');
    const port = parseInt(config.get<string>('SMTP_PORT') ?? '1025', 10);
    const user = config.get<string>('SMTP_USER');
    const pass = config.get<string>('SMTP_PASS');
    this.defaultFrom = config.get<string>('MAIL_FROM', 'no-reply@skynet.local');

    const auth = user ? { user, pass } : undefined;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: false,
      ...(auth ? { auth } : {}),
    });
  }

  async sendVisitSummary(payload: VisitMailPayload) {
    if (!payload.to) {
      this.logger.warn('Skipping email for visit because destination address is missing');
      return;
    }

    await this.transporter.sendMail({
      from: this.defaultFrom,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      attachments: payload.pdf
        ? [
            {
              filename: payload.filename ?? 'visit-summary.pdf',
              content: payload.pdf,
            },
          ]
        : undefined,
    });

    this.logger.log(`Notification email sent to ${payload.to}`);
  }
}
