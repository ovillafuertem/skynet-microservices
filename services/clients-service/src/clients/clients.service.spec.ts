import { ClientsService } from './clients.service';

// Mock liviano de Prisma Client (solo métodos usados)
const prismaMock = {
  client: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  $transaction: jest.fn((ops: any[]) => Promise.all(ops)),
} as any;

jest.mock('@prisma/client', () => {
  const actual = jest.requireActual('@prisma/client');
  // devolvemos la enum para tipos y un PrismaClient simulado
  class PrismaClient {
    client = prismaMock.client;
    $transaction = prismaMock.$transaction;
  }
  return { ...actual, PrismaClient };
});

describe('ClientsService (unit)', () => {
  let service: ClientsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ClientsService();
    // @ts-ignore — inyectamos nuestro mock
    service['prisma'] = { ...prismaMock };
  });

  it('create() crea un cliente', async () => {
    prismaMock.client.create.mockResolvedValue({ id: '1', email: 'a@b.com' });
    const out = await service.create({ name: 'A', email: 'a@b.com' } as any);
    expect(out.email).toBe('a@b.com');
  });

  it('findAll() pagina y cuenta', async () => {
    prismaMock.client.findMany.mockResolvedValue([{ id: '1' }]);
    prismaMock.client.count.mockResolvedValue(1);
    const res = await service.findAll({ page: 1, limit: 10 } as any);
    expect(res.total).toBe(1);
    expect(res.items).toHaveLength(1);
  });

  it('findOne() lanza 404 si no existe', async () => {
    prismaMock.client.findUnique.mockResolvedValue(null);
    await expect(service.findOne('x')).rejects.toThrow('Client not found');
  });

  it('update() retorna actualizado o 404', async () => {
    prismaMock.client.update.mockResolvedValue({ id: '1', status: 'INACTIVE' });
    const res = await service.update('1', { status: 'INACTIVE' } as any);
    expect(res.status).toBe('INACTIVE');

    prismaMock.client.update.mockRejectedValue(new Error('not found'));
    await expect(service.update('bad', {} as any)).rejects.toThrow('Client not found');
  });

  it('remove() borra o 404', async () => {
    prismaMock.client.delete.mockResolvedValue({});
    await expect(service.remove('1')).resolves.toEqual({ deleted: true });

    prismaMock.client.delete.mockRejectedValue(new Error('nf'));
    await expect(service.remove('bad')).rejects.toThrow('Client not found');
  });
});
