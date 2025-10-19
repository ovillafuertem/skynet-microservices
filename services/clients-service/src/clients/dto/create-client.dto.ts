import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEmail, IsEnum, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

enum ClientStatus { ACTIVE='ACTIVE', INACTIVE='INACTIVE' }

export class CreateClientDto {
  @ApiProperty({ example: 'Sarah Connor' })
  @IsString() @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'sarah@resistance.org' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+50255551234', required: false })
  @IsOptional() @IsString() @MaxLength(30)
  phone?: string;

  @ApiProperty({ example: 'Zona 4, Ciudad de Guatemala', required: false })
  @IsOptional() @IsString()
  address?: string;

  @ApiProperty({ example: 14.64072, required: false })
  @IsOptional() @Type(() => Number) @IsNumber()
  lat?: number;

  @ApiProperty({ example: -90.51327, required: false })
  @IsOptional() @Type(() => Number) @IsNumber()
  lng?: number;

  @ApiProperty({ example: 'Cliente vip', required: false })
  @IsOptional() @IsString()
  notes?: string;

  @ApiProperty({ enum: ClientStatus, required: false, example: 'ACTIVE' })
  @IsOptional() @IsEnum(ClientStatus)
  status?: ClientStatus;
}
