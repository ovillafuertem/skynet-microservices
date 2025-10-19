import { IsEnum, IsOptional, IsString } from 'class-validator';
import { VisitStatus } from '@prisma/client';

export class UpdateStatusDto {
  @IsEnum(VisitStatus)
  status: VisitStatus;

  @IsOptional() @IsString()
  cancelReason?: string;
}