import { IsISO8601, IsOptional, IsString, IsEnum, IsUUID, ValidateIf } from 'class-validator';
import { Transform } from 'class-transformer';
import { VisitStatus } from '@prisma/client';

export class CreateVisitDto {
  @ValidateIf((o) => !o.clientName)
  @IsUUID()
  clientId?: string;

  @ValidateIf((o) => !o.clientId)
  @IsString()
  clientName?: string;

  @ValidateIf((o) => !o.technicianName)
  @IsUUID()
  technicianId?: string;

  @ValidateIf((o) => !o.technicianId)
  @IsString()
  technicianName?: string;

  @IsISO8601()
  @Transform(({ value, obj }) => value ?? obj.scheduledDate)
  scheduledAt: string; // fecha ISO (interpretada en America/Guatemala)

  @IsOptional() @IsISO8601() windowStart?: string; // ISO
  @IsOptional() @IsISO8601() windowEnd?: string;   // ISO

  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsEnum(VisitStatus) status?: VisitStatus; // default PLANNED
}
