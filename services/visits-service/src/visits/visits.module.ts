import { Module } from '@nestjs/common';
import { VisitsService } from './visits.service';
import { VisitsController } from './visits.controller';
import { PrismaService } from '../prisma/prisma.service';
import { TechniciansModule } from '../technicians/technicians.module';
import { ChecksController } from './visits/checks/checks.controller';
import { ChecksService } from './visits/checks/checks.service';
import { IdempotencyService } from './visits/checks/validators/idempotency.service';
import { VisitNotificationsQueue } from './visit-notifications.queue';

@Module({
  imports: [TechniciansModule], // Si el service de visits usa el de techinicians
  controllers: [VisitsController, ChecksController],
  providers: [ChecksService, VisitsService, PrismaService, IdempotencyService, VisitNotificationsQueue],
})
export class VisitsModule {}
