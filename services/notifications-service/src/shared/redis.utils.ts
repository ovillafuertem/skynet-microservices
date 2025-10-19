import type { ConfigService } from '@nestjs/config';
import type { RedisOptions } from 'bullmq';

export function buildRedisConnection(config: ConfigService): RedisOptions {
  const url = config.get<string>('REDIS_URL');
  if (url) return { url };

  const host = config.get<string>('REDIS_HOST', 'localhost');
  const port = parseInt(config.get<string>('REDIS_PORT') ?? '6379', 10);
  const username = config.get<string>('REDIS_USERNAME');
  const password = config.get<string>('REDIS_PASSWORD');

  return {
    host,
    port,
    ...(username ? { username } : {}),
    ...(password ? { password } : {}),
  };
}
