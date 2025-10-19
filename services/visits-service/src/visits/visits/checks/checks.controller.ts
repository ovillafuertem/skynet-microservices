import { Body, Controller, Get, Headers, HttpCode, Ip, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ChecksService } from './checks.service';
import { CheckInDto } from './dto/check-in.dto';
import { PrismaService } from '../../../prisma/prisma.service';
import { VisitOwnershipGuard } from './policies/visit-ownership.guard';
import { IdempotencyService } from './validators/idempotency.service';

@ApiTags('visits-checks')
@ApiBearerAuth()
@Controller('visits/:id')
export class ChecksController {
    constructor(
        private readonly service: ChecksService,
        private readonly prisma: PrismaService,
        private readonly idem: IdempotencyService,
    ) { }

    @UseGuards(VisitOwnershipGuard)
    @Post('check-in')
    @ApiOperation({ summary: 'Registrar check-in' })
    @ApiResponse({ status: 201 })
    async checkIn(
        @Param('id') id: string,
        @Body() dto: CheckInDto,
        @Headers('Idempotency-Key') idemKey: string,
        @Ip() ip: string,
        @Req() req: any,
    ) {
        const userId = req.user?.sub;
        const fingerprint = JSON.stringify(dto);
        await this.idem.ensureOnce(idemKey, fingerprint);
        const idemKeyHash = idemKey ? this.idem.hash(idemKey) : undefined;

        // si ya existe el evento con esa llave, devolverlo
        if (idemKeyHash) {
            const existing = await this.prisma.visitCheck.findUnique({ where: { idemKeyHash } });
            if (existing) return existing;
        }

        return this.service.checkIn(id, userId, dto, { ip, idemKeyHash });
    }

    @UseGuards(VisitOwnershipGuard)
    @Post('check-out')
    @ApiOperation({ summary: 'Registrar check-out' })
    async checkOut(
        @Param('id') id: string,
        @Body() dto: CheckInDto,
        @Headers('Idempotency-Key') idemKey: string,
        @Ip() ip: string,
        @Req() req: any,
    ) {
        const userId = req.user?.sub;
        const fingerprint = JSON.stringify(dto);
        await this.idem.ensureOnce(idemKey, fingerprint);
        const idemKeyHash = idemKey ? this.idem.hash(idemKey) : undefined;

        if (idemKeyHash) {
            const existing = await this.prisma.visitCheck.findUnique({ where: { idemKeyHash } });
            if (existing) return existing;
        }

        return this.service.checkOut(id, userId, dto, { ip, idemKeyHash });
    }

    @UseGuards(VisitOwnershipGuard)
    @Get('checks')
    @ApiOperation({ summary: 'Listar checks de la visita' })
    async list(@Param('id') id: string) {
        return this.prisma.visitCheck.findMany({ where: { visitId: id }, orderBy: { occurredAt: 'asc' } });
    }
}