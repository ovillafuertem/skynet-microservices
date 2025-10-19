import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Mapea usuarios de prueba de Keycloak
  const technicians = [
    { keycloakUserId: 'a6539926-9947-459f-9316-a4147dbeb38b', displayName: 'Tec 1', email: 'tec1@skynet.local' },
  ];

  for (const t of technicians) {
    await prisma.technician.upsert({
      where: { keycloakUserId: t.keycloakUserId },
      create: t,
      update: t,
    });
  }

  // Clientes de demo
  const c1 = await prisma.client.upsert({
    where: { id: 'demo-c1' },
    create: { id: 'demo-c1', name: 'Acme S.A.', address: 'Zona 4', email: 'demo-c1@skynet.local' },
    update: {},
  });

  // Visita de ejemplo para hoy
  const today = new Date();
  await prisma.visit.create({
    data: {
      clientId: c1.id,
      technicianId: (await prisma.technician.findFirst({ where: { keycloakUserId: 'sub-tec1' } }))!.id,
      scheduledDate: today,
      windowStart: new Date(today.setHours(9, 0, 0, 0)),
      windowEnd: new Date(today.setHours(10, 0, 0, 0)),
      notes: 'Revisión preventiva',
    },
  });
}

main().finally(() => prisma.$disconnect());