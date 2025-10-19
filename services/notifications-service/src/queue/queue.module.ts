import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { VISIT_COMPLETED_QUEUE_NAME } from './queue.constants';
import { VisitCompletedQueueProvider } from './visit-completed-queue.provider';
import { buildRedisConnection } from '../shared/redis.utils';

export const VISIT_COMPLETED_QUEUE = 'VISIT_COMPLETED_QUEUE';

@Module({
  imports: [ConfigModule],
  providers: [
    VisitCompletedQueueProvider,
    {
      provide: VISIT_COMPLETED_QUEUE,
      useFactory: (provider: VisitCompletedQueueProvider) => provider.queue,
      inject: [VisitCompletedQueueProvider],
    },
  ],
  exports: [VISIT_COMPLETED_QUEUE],
})
export class QueueModule {}
