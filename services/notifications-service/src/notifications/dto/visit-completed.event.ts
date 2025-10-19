import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEmail, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';

export class VisitPartyDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'user@skynet.local', required: false })
  @IsOptional()
  @IsEmail()
  email?: string | null;
}

export class VisitCompletedEventDto {
  @ApiProperty()
  @IsUUID()
  visitId: string;

  @ApiProperty()
  @IsString()
  completedAtIso: string;

  @ApiProperty({ type: VisitPartyDto })
  @ValidateNested()
  @Type(() => VisitPartyDto)
  client: VisitPartyDto;

  @ApiProperty({ type: VisitPartyDto })
  @ValidateNested()
  @Type(() => VisitPartyDto)
  technician: VisitPartyDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  address?: string | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  summaryHtml?: string | null;
}

export type VisitCompletedPayload = VisitCompletedEventDto;
