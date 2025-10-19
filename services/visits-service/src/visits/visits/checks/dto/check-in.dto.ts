import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsISO8601, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

enum CheckMethod { GEO = 'GEO', MANUAL = 'MANUAL', QR = 'QR' }
enum CheckSource { ONLINE = 'ONLINE', OFFLINE = 'OFFLINE' }

export class CheckInDto {
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

    @ApiProperty({ enum: CheckMethod, default: CheckMethod.GEO })
    @IsEnum(CheckMethod)
    method: CheckMethod = CheckMethod.GEO;

    @ApiProperty({ enum: CheckSource, default: CheckSource.ONLINE })
    @IsEnum(CheckSource)
    source: CheckSource = CheckSource.ONLINE;

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