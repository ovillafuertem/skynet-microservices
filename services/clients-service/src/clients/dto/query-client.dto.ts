import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsInt, IsOptional, IsPositive, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

enum ClientStatus { ACTIVE='ACTIVE', INACTIVE='INACTIVE' }

export class QueryClientDto {
  @ApiPropertyOptional({ example: 1 })
  @Type(()=>Number) @IsOptional() @IsInt() @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10 })
  @Type(()=>Number) @IsOptional() @IsInt() @IsPositive() @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ example: 'ACTIVE', enum: ClientStatus })
  @IsOptional() @IsEnum(ClientStatus)
  status?: ClientStatus;

  @ApiPropertyOptional({ example: 'sarah@resistance.org' })
  @IsOptional() @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'Sarah' })
  @IsOptional() @IsString()
  search?: string; // name|email like

  @ApiPropertyOptional({ example: 'Acme', description: 'Alias para search' })
  @IsOptional() @IsString()
  q?: string;
}
