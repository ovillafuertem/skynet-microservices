import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { VisitsService } from './visits.service';
import { CreateVisitDto } from './dto/create-visit.dto';
import { BulkCreateVisitDto } from './dto/bulk-create-visit.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { QueryVisitsDto } from './dto/query-visits.dto';
import { JwtAuthGuard } from '../common/auth/jwt.guard';
import { RolesGuard } from '../common/auth/roles.guard';
import { Roles } from '../common/auth/roles.decorator';
import type { Request } from 'express';
import { Req } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { UpdateVisitDto } from './dto/update-visit.dto';

@ApiBearerAuth('access-token')
@Controller('visits')
@UseGuards(JwtAuthGuard, RolesGuard)

export class VisitsController {
  constructor(private readonly visits: VisitsService) {}


  @Post()
  @Roles('ADMIN', 'SUPERVISOR')
  create(@Body() dto: CreateVisitDto, @Req() req: Request) {
    const authHeader = req.headers['authorization'];
    const accessToken =
      typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : Array.isArray(authHeader) && authHeader[0].startsWith('Bearer ')
          ? authHeader[0].slice(7)
          : undefined;
    const user: any = (req as any).user || {};
    return this.visits.create(dto, {
      accessToken,
      keycloakSub: user.sub,
      roles: user.roles ?? user.realm_access?.roles ?? [],
      displayName: user.preferred_username ?? user.name ?? null,
      email: user.email ?? null,
    });
  }

  @Post('bulk')
  @Roles('ADMIN', 'SUPERVISOR')
  bulk(@Body() dto: BulkCreateVisitDto, @Req() req: Request) {
    const authHeader = req.headers['authorization'];
    const accessToken =
      typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : Array.isArray(authHeader) && authHeader[0].startsWith('Bearer ')
          ? authHeader[0].slice(7)
          : undefined;
    const user: any = (req as any).user || {};
    return this.visits.bulkCreate(dto, {
      accessToken,
      keycloakSub: user.sub,
      roles: user.roles ?? user.realm_access?.roles ?? [],
      displayName: user.preferred_username ?? user.name ?? null,
      email: user.email ?? null,
    });
  }

  @Get('today')
  @Roles('ADMIN', 'SUPERVISOR', 'TECNICO')
  listToday(@Req() req: Request, @Query('mine') mine?: string, @Query('technicianId') technicianId?: string) {
    // req.user viene del JwtAuthGuard (Sección 3): contiene sub, roles
    const user: any = (req as any).user || {};
    return this.visits.listToday({
      technicianId,
      mine: mine === 'true',
      keycloakSub: user.sub,
      roles: user.roles ?? user.realm_access?.roles ?? [],
      displayName: user.preferred_username ?? user.name ?? null,
      email: user.email ?? null,
    });
  }

  @Get()
  @Roles('ADMIN', 'SUPERVISOR', 'TECNICO')
  list(@Req() req: Request, @Query() q: QueryVisitsDto) {
    const user: any = (req as any).user || {};
    return this.visits.list(q, {
      keycloakSub: user.sub,
      roles: user.roles ?? user.realm_access?.roles ?? [],
      displayName: user.preferred_username ?? user.name ?? null,
      email: user.email ?? null,
    });
  }

  @Get('clients')
  @Roles('ADMIN', 'SUPERVISOR', 'TECNICO')
  async listClients(@Req() req: Request, @Query('q') q?: string) {
    const authHeader = req.headers['authorization'];
    const accessToken =
      typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : Array.isArray(authHeader) && authHeader[0].startsWith('Bearer ')
          ? authHeader[0].slice(7)
          : undefined;
    return this.visits.fetchClients(q, { accessToken });
  }

  @Get('technicians')
  @Roles('ADMIN', 'SUPERVISOR', 'TECNICO')
  async listTechnicians() {
    return this.visits.fetchTechnicians();
  }

  @Get(':id')
  @Roles('ADMIN', 'SUPERVISOR', 'TECNICO')
  get(@Param('id') id: string) { return this.visits.get(id); }

  @Patch(':id')
  @Roles('ADMIN', 'SUPERVISOR')
  updateVisit(@Param('id') id: string, @Body() dto: UpdateVisitDto, @Req() req: Request) {
    const user: any = (req as any).user || {};
    const authHeader = req.headers['authorization'];
    const accessToken =
      typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : Array.isArray(authHeader) && authHeader[0].startsWith('Bearer ')
          ? authHeader[0].slice(7)
          : undefined;
    return this.visits.update(id, dto, {
      accessToken,
      keycloakSub: user.sub,
      roles: user.roles ?? user.realm_access?.roles ?? [],
      displayName: user.preferred_username ?? user.name ?? null,
      email: user.email ?? null,
    });
  }

  @Patch(':id/status')
  @Roles('ADMIN', 'SUPERVISOR', 'TECNICO')
  updateStatus(@Param('id') id: string, @Req() req: Request, @Body() dto: UpdateStatusDto) {
    const user: any = (req as any).user || {};
    return this.visits.updateStatus(id, dto, {
      keycloakSub: user.sub,
      roles: user.roles ?? user.realm_access?.roles ?? [],
    });
  }

  @Post(':id/complete')
  @Roles('ADMIN', 'SUPERVISOR', 'TECNICO')
  async complete(@Param('id') id: string, @Req() req: Request) {
    const user: any = (req as any).user || {};
    return this.visits.complete(id, { keycloakSub: user.sub, roles: user.roles ?? user.realm_access?.roles ?? [] });
  }
}
