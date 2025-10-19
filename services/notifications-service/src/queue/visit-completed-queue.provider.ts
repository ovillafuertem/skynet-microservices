import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { VISIT_COMPLETED_QUEUE_NAME } from './queue.constants';
import { buildRedisConnection } from '../shared/redis.utils';

@Injectable()
export class VisitCompletedQueueProvider implements OnModuleDestroy {
  private readonly logger = new Logger(VisitCompletedQueueProvider.name);
  readonly queue: Queue;

  constructor(private readonly config: ConfigService) {
    const connection = buildRedisConnection(config);
    this.queue = new Queue(VISIT_COMPLETED_QUEUE_NAME, {
      connection,
      defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    });
  }

  async onModuleDestroy() {
    this.logger.log('Closing BullMQ queue…');
    await this.queue.close();
    this.logger.log('Queue closed');
  }
}
