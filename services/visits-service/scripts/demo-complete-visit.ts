import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { VisitsService } from '../src/visits/visits.service';
import { VisitStatus } from '@prisma/client';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'error', 'warn'],
  });

  const prisma = app.get(PrismaService);
  const visitsService = app.get(VisitsService);

  const client = await prisma.client.create({
    data: {
      name: 'Banco Industrial (demo)',
      email: `demo-client-${Date.now()}@skynet.local`,
      status: 'ACTIVE',
    },
  });

  const technician = await prisma.technician.create({
    data: {
      keycloakUserId: `demo-tech-${Date.now()}`,
      displayName: 'Tecnico Demo',
      email: `demo-tech-${Date.now()}@skynet.local`,
    },
  });

  const visit = await prisma.visit.create({
    data: {
      clientId: client.id,
      technicianId: technician.id,
      scheduledDate: new Date(),
      status: VisitStatus.PLANNED,
      notes: 'Visita generada por demo-complete-visit.ts',
    },
  });

  const result = await visitsService.updateStatus(
    visit.id,
    { status: VisitStatus.DONE },
    { keycloakSub: technician.keycloakUserId, roles: ['ADMIN'] },
  );

  // eslint-disable-next-line no-console
  console.log('Visit marked as DONE and notification enqueued:', {
    visitId: result.id,
    completedAt: result.completedAt,
    clientEmail: client.email,
  });

  await app.close();
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
