import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';

describe('ClientsService (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;

  beforeAll(async () => {
  // Garantiza que Prisma vea SQLite (por si alguien corre Jest directo sin setup)
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'file:./test.db';

  // Crea app Nest
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  await app.init();

  // Usa Prisma ya con la URL correcta (cliente generado desde schema.test.prisma)
  prisma = new PrismaClient();
  await prisma.client.deleteMany();
});

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('POST /clients crea cliente y valida email', async () => {
    // Falla por email inválido
    await request(app.getHttpServer())
      .post('/clients')
      .send({ name: 'Sarah', email: 'not-an-email' })
      .expect(400);

    // Crea OK
    const res = await request(app.getHttpServer())
      .post('/clients')
      .send({ name: 'Sarah Connor', email: 'sarah@resistance.org' })
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.email).toBe('sarah@resistance.org');
  });

  it('GET /clients pagina y filtra', async () => {
    await request(app.getHttpServer()).post('/clients').send({ name: 'Kyle', email: 'kyle@resistance.org' });
    const res = await request(app.getHttpServer())
      .get('/clients?page=1&limit=1&search=Kyle')
      .expect(200);

    expect(res.body.total).toBeGreaterThanOrEqual(1);
    expect(res.body.items[0].name).toContain('Kyle');
  });

  it('GET /clients/:id obtiene uno', async () => {
    const created = await request(app.getHttpServer())
      .post('/clients')
      .send({ name: 'T-800', email: 't800@skynet.ai' })
      .expect(201);

    const g = await request(app.getHttpServer())
      .get(`/clients/${created.body.id}`)
      .expect(200);

    expect(g.body.email).toBe('t800@skynet.ai');
  });

  it('PATCH /clients/:id actualiza', async () => {
    const created = await request(app.getHttpServer())
      .post('/clients')
      .send({ name: 'John', email: 'john@resistance.org' })
      .expect(201);

    const up = await request(app.getHttpServer())
      .patch(`/clients/${created.body.id}`)
      .send({ status: 'INACTIVE', notes: 'debrief' })
      .expect(200);

    expect(up.body.status).toBe('INACTIVE');
    expect(up.body.notes).toBe('debrief');
  });

  it('DELETE /clients/:id borra', async () => {
    const created = await request(app.getHttpServer())
      .post('/clients')
      .send({ name: 'ToDel', email: 'del@resistance.org' })
      .expect(201);

    await request(app.getHttpServer()).delete(`/clients/${created.body.id}`).expect(200);
    await request(app.getHttpServer()).get(`/clients/${created.body.id}`).expect(404);
  });
});
