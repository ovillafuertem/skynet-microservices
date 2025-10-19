import { OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
export declare class VisitCompletedQueueProvider implements OnModuleDestroy {
    private readonly config;
    private readonly logger;
    readonly queue: Queue;
    constructor(config: ConfigService);
    onModuleDestroy(): Promise<void>;
}
