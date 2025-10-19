import { Injectable, NotFoundException } from '@nestjs/common';
//import { PrismaClient, ClientStatus } from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { QueryClientDto } from './dto/query-client.dto';

type ClientStatusT = 'ACTIVE' | 'INACTIVE';

@Injectable()
export class ClientsService {
  private prisma = new PrismaClient();

  async create(dto: CreateClientDto) {
    return this.prisma.client.create({ data: dto });
  }

  async findAll(q: QueryClientDto) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (q.status) where.status = q.status as ClientStatusT;
    if (q.email) where.email = q.email;
    const searchTerm = q.search ?? q.q;
    if (searchTerm) {
      where.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } }
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.client.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.client.count({ where })
    ]);

    return {
      page, limit, total, pages: Math.ceil(total / limit),
      items
    };
  }

  async findOne(id: string) {
    const client = await this.prisma.client.findUnique({ where: { id } });
    if (!client) throw new NotFoundException('Client not found');
    return client;
  }

  async update(id: string, dto: UpdateClientDto) {
    try {
      return await this.prisma.client.update({ where: { id }, data: dto });
    } catch {
      throw new NotFoundException('Client not found');
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.client.delete({ where: { id } });
      return { deleted: true };
    } catch {
      throw new NotFoundException('Client not found');
    }
  }
}
