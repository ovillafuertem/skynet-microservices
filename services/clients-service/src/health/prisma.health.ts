import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaHealthIndicator extends HealthIndicator {
  
  private prisma = new PrismaClient();

  // Simple ping a la DB (compatible con Postgres y SQLite)
  async pingCheck(key = 'database'): Promise<HealthIndicatorResult> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return this.getStatus(key, true);
    } catch (e) {
      throw new HealthCheckError('Prisma check failed', this.getStatus(key, false, { error: String(e) }));
    }
  }
}
