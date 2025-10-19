import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { PrismaHealthIndicator } from './prisma.health';

@Controller()
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaIndicator: PrismaHealthIndicator,
  ) {}

  // Liveness: ¿está viva la app?
  @Get('/health')
  @HealthCheck()
  check() {
    return this.health.check([() => this.prismaIndicator.pingCheck('database')]);
  }

  // Readiness: ¿lista para tráfico? (puedes añadir más checks si necesitas)
  @Get('/ready')
  @HealthCheck()
  ready() {
    return this.health.check([() => this.prismaIndicator.pingCheck('database')]);
  }
}
