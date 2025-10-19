import type { ConfigService } from '@nestjs/config';
import type { RedisOptions } from 'bullmq';
export declare function buildRedisConnection(config: ConfigService): RedisOptions;
