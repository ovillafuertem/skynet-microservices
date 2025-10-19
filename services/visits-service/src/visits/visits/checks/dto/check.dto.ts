
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsISO8601, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { CheckMethod, CheckSource } from '@prisma/client';

export class CheckDto {
    @ApiPropertyOptional({ example: 14.64072 })
    @IsOptional()
    @IsNumber()
    lat?: number;

    @ApiPropertyOptional({ example: -90.51327 })
    @IsOptional()
    @IsNumber()
    lng?: number;

    @ApiPropertyOptional({ example: '2025-09-21T14:02:00Z' })
    @IsOptional()
    @IsISO8601()
    deviceAt?: string;

    @ApiPropertyOptional({ enum: CheckMethod, default: CheckMethod.GEO })
    @IsOptional()
    @IsEnum(CheckMethod)
    method?: CheckMethod;

    @ApiPropertyOptional({ enum: CheckSource, default: CheckSource.ONLINE })
    @IsOptional()
    @IsEnum(CheckSource)
    source?: CheckSource;

    @ApiPropertyOptional({ example: 'android-abc' })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    deviceId?: string;

    @ApiPropertyOptional({ example: 'Llegué al sitio' })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    notes?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    photoUrl?: string;
}
