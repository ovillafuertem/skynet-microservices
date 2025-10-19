import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { MailService } from './providers/mail.service';
import { PdfService } from './providers/pdf.service';
import { QueueModule, VISIT_COMPLETED_QUEUE } from '../queue/queue.module';
import { VisitCompletedProcessor } from './processors/visit-completed.processor';

@Module({
  imports: [QueueModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, MailService, PdfService, VisitCompletedProcessor],
})
export class NotificationsModule {}
