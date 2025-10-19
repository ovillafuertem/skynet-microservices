import { Module } from '@nestjs/common';
import { TechniciansService } from './technicians.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [TechniciansService, PrismaService],
  exports: [TechniciansService],
})
export class TechniciansModule {}
