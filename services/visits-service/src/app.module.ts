import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PrismaService } from './prisma/prisma.service';
import { VisitsModule } from './visits/visits.module';
import { TechniciansModule } from './technicians/technicians.module';
import { JwtAuthGuard } from './common/auth/jwt.guard';
import { RolesGuard } from './common/auth/roles.guard';
import { AuthModule } from './common/auth/auth.module';
import { ReportsModule } from './reports/reports.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    AuthModule,
    VisitsModule,
    TechniciansModule,
    ReportsModule,
  ],
  providers: [
    PrismaService,
    // que sean globales (como en clients-service)
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
