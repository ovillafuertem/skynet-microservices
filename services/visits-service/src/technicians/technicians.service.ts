// src/technicians/technicians.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TechniciansService {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.technician.findUnique({ where: { id } });
  }

  findByKeycloakSub(sub: string) {
    return this.prisma.technician.findUnique({ where: { keycloakUserId: sub } });
  }
}
