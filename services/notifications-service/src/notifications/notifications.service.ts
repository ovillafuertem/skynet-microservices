import { Inject, Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { VISIT_COMPLETED_QUEUE } from '../queue/queue.module';
import type { VisitCompletedPayload } from './dto/visit-completed.event';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(@Inject(VISIT_COMPLETED_QUEUE) private readonly queue: Queue) {}

  async enqueueVisitCompleted(payload: VisitCompletedPayload) {
    this.logger.debug(`Enqueuing visit.completed notification for visit ${payload.visitId}`);
    await this.queue.add('visit.completed', payload, {
      removeOnComplete: 50,
      removeOnFail: 20,
    });
  }
}
