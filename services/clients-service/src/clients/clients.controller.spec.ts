import { Test, TestingModule } from '@nestjs/testing';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';

describe('ClientsController', () => {
  let controller: ClientsController;

  const serviceMock = {
    create: jest.fn(),
    findAll: jest.fn().mockResolvedValue({ items: [], total: 0, page: 1, limit: 10, pages: 0 }),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientsController],
      providers: [{ provide: ClientsService, useValue: serviceMock }],
    }).compile();

    controller = module.get<ClientsController>(ClientsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('GET /clients delega en service.findAll', async () => {
    await expect(controller.findAll({ page: 1, limit: 10 } as any)).resolves.toEqual({
      items: [], total: 0, page: 1, limit: 10, pages: 0,
    });
    expect(serviceMock.findAll).toHaveBeenCalledWith({ page: 1, limit: 10 });
  });
});
