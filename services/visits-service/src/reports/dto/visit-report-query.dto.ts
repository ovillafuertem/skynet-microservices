import { ApiPropertyOptional } from '@nestjs/swagger';
import { VisitStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsISO8601, IsOptional, IsString, IsUUID } from 'class-validator';

export class VisitReportQueryDto {
  @ApiPropertyOptional({ description: 'Fecha inicial ISO8601 (inclusive)', example: '2025-10-10T00:00:00Z' })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({ description: 'Fecha final ISO8601 (inclusive)', example: '2025-10-15T23:59:59Z' })
  @IsOptional()
  @IsISO8601()
  to?: string;

  @ApiPropertyOptional({ enum: VisitStatus })
  @IsOptional()
  @IsEnum(VisitStatus)
  status?: VisitStatus;

  @ApiPropertyOptional({ description: 'Filtra por técnico' })
  @IsOptional()
  @IsUUID()
  technicianId?: string;

  @ApiPropertyOptional({ description: 'Filtra por cliente' })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional({ description: 'Texto libre para buscar en notas', example: 'preventiva' })
  @IsOptional()
  @IsString()
  search?: string;
}
