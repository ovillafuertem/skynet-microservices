import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { buildRedisConnection } from '../common/redis.util';
import { VisitCompletedEvent } from './dto/visit-completed.event';

@Injectable()
export class VisitNotificationsQueue implements OnModuleDestroy {
  private readonly logger = new Logger(VisitNotificationsQueue.name);
  private readonly queue: Queue;
  private readonly queueName: string;

  constructor(private readonly config: ConfigService) {
    this.queueName = config.get<string>('NOTIFICATIONS_QUEUE', 'visit.completed');
    this.queue = new Queue(this.queueName, {
      connection: buildRedisConnection(config),
      defaultJobOptions: {
        removeOnComplete: 20,
        removeOnFail: 20,
        attempts: 2,
      },
    });
  }

  async enqueueVisitCompleted(payload: VisitCompletedEvent) {
    this.logger.debug(`Encolando evento visit.completed para visita ${payload.visitId}`);
    await this.queue.add('visit.completed', payload);
  }

  async onModuleDestroy() {
    await this.queue.close();
  }
}
