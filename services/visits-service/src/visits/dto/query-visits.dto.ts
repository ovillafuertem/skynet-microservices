import { IsBooleanString, IsEnum, IsISO8601, IsOptional, IsUUID, IsString } from 'class-validator';
import { VisitStatus } from '@prisma/client';

export class QueryVisitsDto {
  @IsOptional() @IsISO8601() from?: string; // ISO
  @IsOptional() @IsISO8601() to?: string;   // ISO (exclusive)
  @IsOptional() @IsISO8601() date?: string;
  @IsOptional() @IsUUID() technicianId?: string;
  @IsOptional() @IsUUID() clientId?: string;
  @IsOptional() @IsEnum(VisitStatus) status?: VisitStatus;
  @IsOptional() @IsBooleanString() mine?: string; // "true" para filtrar por técnico autenticado
  @IsOptional() @IsString() team?: string;
}
