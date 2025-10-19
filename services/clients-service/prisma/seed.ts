import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.client.createMany({
    data: [
      { name: 'Sarah Connor', email: 'sarah@resistance.org', phone: '+50255550001' },
      { name: 'Kyle Reese',   email: 'kyle@resistance.org',  phone: '+50255550002' },
      { name: 'T-800',        email: 't800@skynet.ai',        status: 'INACTIVE' as any },
    ],
  });
}
main().finally(()=>prisma.$disconnect());
