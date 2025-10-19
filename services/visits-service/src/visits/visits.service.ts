import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVisitDto } from './dto/create-visit.dto';
import { BulkCreateVisitDto } from './dto/bulk-create-visit.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { QueryVisitsDto } from './dto/query-visits.dto';
import { UpdateVisitDto } from './dto/update-visit.dto';
import { Visit, VisitStatus, ClientStatus, Technician } from '@prisma/client';
import { dayBoundsInUTC } from '../common/tz.util';
import { isBefore, areIntervalsOverlapping } from 'date-fns';
import { VisitNotificationsQueue } from './visit-notifications.queue';
import { VisitCompletedEvent } from './dto/visit-completed.event';

type IdentityContext = {
  keycloakSub?: string;
  roles?: string[];
  displayName?: string | null;
  email?: string | null;
};
type AuthContext = IdentityContext;
type RequestContext = IdentityContext & { accessToken?: string };
type RemoteClient = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  status?: string | null;
  notes?: string | null;
};

export interface VisitSummary {
  id: string;
  scheduledAt: string;
  windowStart: string | null;
  windowEnd: string | null;
  status: VisitStatus;
  notes: string | null;
  startedAt: string | null;
  completedAt: string | null;
  canceledAt: string | null;
  checkInAt: string | null;
  checkInLat: number | null;
  checkInLng: number | null;
  checkOutAt: string | null;
  checkOutLat: number | null;
  checkOutLng: number | null;
  client: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    status: ClientStatus | null;
    notes: string | null;
    address: string | null;
    lat: number | null;
    lng: number | null;
  };
  technician: {
    id: string;
    name: string;
    email: string | null;
    keycloakUserId?: string | null;
  } | null;
}

@Injectable()
export class VisitsService {
  constructor(
    private prisma: PrismaService,
    private readonly notificationsQueue: VisitNotificationsQueue,
  ) {}

  private readonly clientsServiceBase = process.env.CLIENTS_SERVICE_URL ?? 'http://localhost:3000';

  private toVisitSummary(visit: Visit & { client: any; technician: any }): VisitSummary {
    if (!visit.scheduledDate) {
      throw new Error('Visit missing scheduledDate');
    }
    return {
      id: visit.id,
      scheduledAt: visit.scheduledDate.toISOString(),
      windowStart: visit.windowStart?.toISOString() ?? null,
      windowEnd: visit.windowEnd?.toISOString() ?? null,
      status: visit.status,
      notes: visit.notes ?? null,
      startedAt: visit.startedAt?.toISOString() ?? null,
      completedAt: visit.completedAt?.toISOString() ?? null,
      canceledAt: visit.canceledAt?.toISOString() ?? null,
      checkInAt: visit.checkInAt?.toISOString() ?? null,
      checkInLat: visit.checkInLat,
      checkInLng: visit.checkInLng,
      checkOutAt: visit.checkOutAt?.toISOString() ?? null,
      checkOutLat: visit.checkOutLat,
      checkOutLng: visit.checkOutLng,
      client: {
        id: visit.client.id,
        name: visit.client.name,
        address: visit.client.address ?? null,
        email: visit.client.email ?? null,
        phone: visit.client.phone ?? null,
        status: visit.client.status ?? null,
        notes: visit.client.notes ?? null,
        lat: visit.client.lat ?? null,
        lng: visit.client.lng ?? null,
      },
      technician: visit.technician
        ? {
            id: visit.technician.id,
            name: visit.technician.displayName,
            email: visit.technician.email,
            keycloakUserId: visit.technician.keycloakUserId,
          }
        : null,
    };
  }

  private normalizeRoles(roles: string[] | undefined) {
    return (roles ?? []).map((role) => role.normalize('NFD').replace(/\p{Diacritic}/gu, '').toUpperCase());
  }

  private async ensureTechnicianRecord(
    keycloakSub: string,
    displayName?: string | null,
    email?: string | null
  ): Promise<Technician> {
    let technician = await this.prisma.technician.findUnique({ where: { keycloakUserId: keycloakSub } });
    if (!technician && displayName) {
      const existingByName = await this.prisma.technician.findFirst({
        where: { displayName: { equals: displayName, mode: 'insensitive' } }
      });
      if (existingByName) {
        technician = await this.prisma.technician.update({
          where: { id: existingByName.id },
          data: {
            keycloakUserId: keycloakSub,
            email: existingByName.email ?? email ?? null
          }
        });
      }
    }
    if (!technician && email) {
      const existingByEmail = await this.prisma.technician.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } }
      });
      if (existingByEmail) {
        technician = await this.prisma.technician.update({
          where: { id: existingByEmail.id },
          data: {
            keycloakUserId: keycloakSub,
            displayName: existingByEmail.displayName ?? displayName ?? email,
          }
        });
      }
    }
    if (!technician) {
      technician = await this.prisma.technician.create({
        data: {
          keycloakUserId: keycloakSub,
          displayName: displayName ?? 'Técnico',
          email: email ?? null
        }
      });
    }
    return technician;
  }

  async fetchClients(search: string | undefined, ctx: RequestContext = {}) {
    const remoteClients = await this.searchClientsInService(search, ctx);
    const results: {
      id: string;
      name: string;
      email?: string;
      phone?: string | null;
      address?: string | null;
      status?: ClientStatus | null;
      notes?: string | null;
      lat?: number | null;
      lng?: number | null;
    }[] = [];

    for (const remote of remoteClients) {
      const record = await this.upsertClientFromRemote(remote);
      results.push({
        id: record.id,
        name: record.name,
        email: record.email ?? undefined,
        phone: record.phone ?? null,
        address: record.address ?? null,
        status: record.status ?? null,
        notes: record.notes ?? null,
        lat: record.lat ?? null,
        lng: record.lng ?? null
      });
    }

    if (results.length === 0) {
      const locals = await this.prisma.client.findMany({
        where: search
          ? {
              status: ClientStatus.ACTIVE,
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
              ]
            }
          : { status: ClientStatus.ACTIVE },
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true,
          status: true,
          notes: true,
          lat: true,
          lng: true
        }
      });

      locals.forEach((client) =>
        results.push({
          id: client.id,
          name: client.name,
          email: client.email ?? undefined,
          phone: client.phone ?? null,
          address: client.address ?? null,
          status: client.status ?? null,
          notes: client.notes ?? null,
          lat: client.lat ?? null,
          lng: client.lng ?? null
        })
      );
    }

    return results;
  }

  async fetchTechnicians() {
    const technicians = await this.prisma.technician.findMany({
      orderBy: { displayName: 'asc' },
      select: {
        id: true,
        displayName: true,
        keycloakUserId: true,
        email: true
      }
    });

    return technicians.map((technician) => ({
      id: technician.id,
      name: technician.displayName,
      keycloakUserId: technician.keycloakUserId,
      email: technician.email ?? undefined
    }));
  }

  private async resolveClient(dto: { clientId?: string; clientName?: string }, ctx: RequestContext) {
    if (!dto.clientId && !dto.clientName) {
      throw new BadRequestException('clientId or clientName is required');
    }

    if (dto.clientId) {
      let existing = await this.prisma.client.findUnique({ where: { id: dto.clientId } });
      if (!existing) {
        const remote = await this.fetchClientByIdFromService(dto.clientId, ctx);
        if (!remote) return null;
        existing = await this.upsertClientFromRemote(remote);
      }
      return existing;
    }

    if (dto.clientName) {
      const local = await this.prisma.client.findFirst({
        where: { name: { equals: dto.clientName, mode: 'insensitive' } }
      });
      if (local) return local;
      const remotes = await this.searchClientsInService(dto.clientName, ctx);
      if (remotes.length === 0) return null;
      const match =
        remotes.find((client) => client.name.toLowerCase() === dto.clientName!.toLowerCase()) ?? remotes[0];
      return this.upsertClientFromRemote(match);
    }

    return null;
  }

  private async resolveTechnician(dto: { technicianId?: string; technicianName?: string }) {
    if (!dto.technicianId && !dto.technicianName) {
      throw new BadRequestException('technicianId or technicianName is required');
    }

    let technician: Technician | null = null;

    if (dto.technicianId) {
      technician = await this.prisma.technician.findUnique({ where: { id: dto.technicianId } });
      if (!technician) {
        technician = await this.prisma.technician.findUnique({ where: { keycloakUserId: dto.technicianId } });
        if (!technician) {
          return this.ensureTechnicianRecord(dto.technicianId, dto.technicianName ?? dto.technicianId, null);
        }
      }
    }

    if (!technician && dto.technicianName) {
      technician = await this.prisma.technician.findFirst({
        where: { displayName: { equals: dto.technicianName, mode: 'insensitive' } }
      });
    }

    return technician;
  }

  private async fetchClientByIdFromService(clientId: string, ctx: RequestContext) {
    if (!ctx.accessToken) return null;
    try {
      const response = await this.requestClientsService(`/clients/${clientId}`, ctx, { method: 'GET' });
      if (response.status === 404) return null;
      if (!response.ok) return null;
      return (await response.json()) as RemoteClient;
    } catch {
      return null;
    }
  }

  private async searchClientsInService(search: string | undefined, ctx: RequestContext) {
    if (!ctx.accessToken) return [] as RemoteClient[];
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (search) params.set('q', search);
      const response = await this.requestClientsService(`/clients?${params.toString()}`, ctx, { method: 'GET' });
      if (!response.ok) return [];
      const payload = await response.json();
      const items = Array.isArray(payload) ? payload : payload?.items;
      if (!Array.isArray(items)) return [];
      return items as RemoteClient[];
    } catch {
      return [];
    }
  }

  private async upsertClientFromRemote(remote: RemoteClient) {
    return this.prisma.client.upsert({
      where: { id: remote.id },
      create: {
        id: remote.id,
        name: remote.name,
        email: remote.email ?? `unknown+${remote.id}@clients.local`,
        phone: remote.phone ?? null,
        status: (remote.status?.toUpperCase() as ClientStatus) ?? ClientStatus.ACTIVE,
        notes: remote.notes ?? null,
        address: remote.address ?? null,
        lat: remote.lat ?? null,
        lng: remote.lng ?? null
      },
      update: {
        name: remote.name,
        email: remote.email ?? `unknown+${remote.id}@clients.local`,
        phone: remote.phone ?? null,
        status: (remote.status?.toUpperCase() as ClientStatus) ?? ClientStatus.ACTIVE,
        notes: remote.notes ?? null,
        address: remote.address ?? null,
        lat: remote.lat ?? null,
        lng: remote.lng ?? null
      }
    });
  }

  private async requestClientsService(path: string, ctx: RequestContext, init: RequestInit) {
    const url = new URL(path, this.clientsServiceBase);
    const headers = new Headers(init.headers ?? {});
    if (ctx.accessToken && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${ctx.accessToken}`);
    }
    return fetch(url, {
      ...init,
      headers
    });
  }

  async create(dto: CreateVisitDto, ctx: RequestContext): Promise<VisitSummary> {
    const { scheduledAt, windowStart, windowEnd } = dto;

    const clientRecord = await this.resolveClient(dto, ctx);
    if (!clientRecord) {
      throw new BadRequestException('Client not found');
    }
    if (clientRecord.status === ClientStatus.INACTIVE) {
      throw new BadRequestException('Client is inactive and cannot receive visits');
    }

    const technicianRecord = await this.resolveTechnician(dto);
    if (!technicianRecord) {
      throw new BadRequestException('Technician not found');
    }

    let ws: Date | null = windowStart ? new Date(windowStart) : null;
    let we: Date | null = windowEnd ? new Date(windowEnd) : null;
    const sd = new Date(scheduledAt);

    if (ws && we && !isBefore(ws, we)) {
      throw new BadRequestException('windowStart must be before windowEnd');
    }

    // Validación anti-solapamiento para el técnico
    if (ws && we) {
      const overlap = await this.prisma.visit.findFirst({
        where: {
          technicianId: technicianRecord.id,
          scheduledDate: sd,
          NOT: { status: VisitStatus.CANCELED },
          AND: [
            { windowStart: { not: null } },
            { windowEnd: { not: null } },
          ],
        },
      });
      if (overlap) {
        // chequeo adicional con intervals en memoria (si se quiere ser más estricto, traer todas del día)
        const sameDay = await this.prisma.visit.findMany({
          where: { technicianId: technicianRecord.id, scheduledDate: sd, NOT: { status: VisitStatus.CANCELED } },
          select: { windowStart: true, windowEnd: true },
        });
        const hasOverlap = sameDay.some(v => v.windowStart && v.windowEnd && areIntervalsOverlapping(
          { start: ws!, end: we! },
          { start: v.windowStart, end: v.windowEnd },
          { inclusive: true },
        ));
        if (hasOverlap) throw new BadRequestException('Time window overlaps with another visit for this technician');
      }
    }

    const created = await this.prisma.visit.create({
      data: {
        clientId: clientRecord.id,
        technicianId: technicianRecord.id,
        scheduledDate: sd,
        windowStart: ws,
        windowEnd: we,
        status: dto.status ?? VisitStatus.PLANNED,
        notes: dto.notes,
      },
      include: { client: true, technician: true },
    });

    return this.toVisitSummary(created);
  }

  async update(id: string, dto: UpdateVisitDto, ctx: RequestContext): Promise<VisitSummary> {
    const visit = await this.prisma.visit.findUnique({ where: { id }, include: { client: true, technician: true } });
    if (!visit) throw new NotFoundException('Visit not found');

    const data: any = {};

    let clientId = visit.clientId;
    if (dto.clientId || dto.clientName) {
      const clientRecord = await this.resolveClient(dto, ctx);
      if (!clientRecord) throw new BadRequestException('Client not found');
      if (clientRecord.status === ClientStatus.INACTIVE) {
        throw new BadRequestException('Client is inactive and cannot receive visits');
      }
      clientId = clientRecord.id;
      data.clientId = clientId;
    }

    let technicianId = visit.technicianId;
    if (dto.technicianId || dto.technicianName) {
      const technicianRecord = await this.resolveTechnician(dto);
      if (!technicianRecord) throw new BadRequestException('Technician not found');
      technicianId = technicianRecord.id;
      data.technicianId = technicianId;
    }

    let scheduledDate = visit.scheduledDate;
    if (dto.scheduledAt) {
      scheduledDate = new Date(dto.scheduledAt);
      data.scheduledDate = scheduledDate;
    }

    let windowStart: Date | null = visit.windowStart;
    if (dto.windowStart) {
      windowStart = new Date(dto.windowStart);
      data.windowStart = windowStart;
    }

    let windowEnd: Date | null = visit.windowEnd;
    if (dto.windowEnd) {
      windowEnd = new Date(dto.windowEnd);
      data.windowEnd = windowEnd;
    }

    if (dto.notes !== undefined) {
      data.notes = dto.notes;
    }

    if (windowStart && windowEnd && !isBefore(windowStart, windowEnd)) {
      throw new BadRequestException('windowStart must be before windowEnd');
    }

    if (windowStart && windowEnd) {
      const sameDay = await this.prisma.visit.findMany({
        where: {
          id: { not: id },
          technicianId,
          scheduledDate,
          NOT: { status: VisitStatus.CANCELED },
          AND: [
            { windowStart: { not: null } },
            { windowEnd: { not: null } },
          ],
        },
        select: { windowStart: true, windowEnd: true },
      });

      const hasOverlap = sameDay.some((v) => v.windowStart && v.windowEnd && areIntervalsOverlapping(
        { start: windowStart!, end: windowEnd! },
        { start: v.windowStart, end: v.windowEnd },
        { inclusive: true }
      ));
      if (hasOverlap) {
        throw new BadRequestException('Time window overlaps with another visit for this technician');
      }
    }

    const updated = await this.prisma.visit.update({
      where: { id },
      data,
      include: { client: true, technician: true },
    });

    return this.toVisitSummary(updated as any);
  }

  async bulkCreate(dto: BulkCreateVisitDto, ctx: RequestContext): Promise<VisitSummary[]> {
    const results: VisitSummary[] = [];
    for (const item of dto.items) {
      const created = await this.create(item, ctx);
      results.push(created);
    }
    return results;
  }

  async listToday(opts: {
    technicianId?: string;
    mine?: boolean;
    keycloakSub?: string;
    roles?: string[];
    displayName?: string | null;
    email?: string | null;
  }): Promise<VisitSummary[]> {
    const now = new Date();
    const { startUtc, endUtc } = dayBoundsInUTC(now);

    // scheduledDate se guarda como Date (en UTC). Para filtrar por día local, comparamos por rango UTC derivado
    const whereBase: any = {
      scheduledDate: { gte: startUtc, lte: endUtc },
    };

    const roles = this.normalizeRoles(opts.roles);
    const technicianOnly =
      roles.length > 0 && roles.includes('TECNICO') && !roles.includes('ADMIN') && !roles.includes('SUPERVISOR');

    if ((opts.mine || technicianOnly) && opts.keycloakSub) {
      const tech = await this.ensureTechnicianRecord(opts.keycloakSub, opts.displayName ?? null, opts.email ?? null);
      whereBase.technicianId = tech.id;
    } else if (opts.technicianId) {
      whereBase.technicianId = opts.technicianId;
    }

    const visits = await this.prisma.visit.findMany({
      where: whereBase,
      orderBy: [
        { windowStart: 'asc' },
        { createdAt: 'asc' },
      ],
      include: { client: true, technician: true },
    });
    return visits.map((visit) => this.toVisitSummary(visit as any));
  }

  async list(query: QueryVisitsDto, auth?: AuthContext): Promise<VisitSummary[]> {
    const where: any = {};

    if (query.from || query.to) {
      where.scheduledDate = {};
      if (query.from) where.scheduledDate.gte = new Date(query.from);
      if (query.to) where.scheduledDate.lte = new Date(query.to);
    }
    if (query.date) {
      const date = new Date(query.date);
      const { startUtc, endUtc } = dayBoundsInUTC(date);
      where.scheduledDate = { gte: startUtc, lte: endUtc };
    }
    if (query.technicianId) where.technicianId = query.technicianId;
    if (query.clientId) where.clientId = query.clientId;
    if (query.status) where.status = query.status;

    const roles = this.normalizeRoles(auth?.roles);
    const technicianOnly =
      roles.length > 0 && roles.includes('TECNICO') && !roles.includes('ADMIN') && !roles.includes('SUPERVISOR');

    if ((query.mine === 'true' || technicianOnly) && auth?.keycloakSub) {
      const tech = await this.ensureTechnicianRecord(auth.keycloakSub, auth.displayName ?? null, auth.email ?? null);
      where.technicianId = tech.id;
    }

    const visits = await this.prisma.visit.findMany({ where, include: { client: true, technician: true } });
    return visits.map((visit) => this.toVisitSummary(visit as any));
  }

  async get(id: string): Promise<VisitSummary> {
    const v = await this.prisma.visit.findUnique({ where: { id }, include: { client: true, technician: true } });
    if (!v) throw new NotFoundException('Visit not found');
    return this.toVisitSummary(v as any);
  }

  async updateStatus(
    id: string,
    dto: UpdateStatusDto,
    auth: { keycloakSub: string; roles: string[] }
  ): Promise<VisitSummary> {
    const visit = await this.prisma.visit.findUnique({ where: { id }, include: { client: true, technician: true } });
    if (!visit) throw new NotFoundException('Visit not found');

    if (dto.status === VisitStatus.DONE && visit.status === VisitStatus.DONE) {
      return this.toVisitSummary(visit as any);
    }

    const roles = this.normalizeRoles(auth.roles);
    const isTech = roles.includes('TECNICO');
    const isAdmin = roles.includes('ADMIN') || roles.includes('SUPERVISOR');

    if (isTech && !isAdmin) {
      const tech = await this.prisma.technician.findUnique({ where: { keycloakUserId: auth.keycloakSub } });
      if (!tech || visit.technicianId !== tech.id) {
        throw new ForbiddenException('Technicians may update only their own visits');
      }
    }

    const patch: any = { status: dto.status };
    const now = new Date();
    switch (dto.status) {
      case 'IN_PROGRESS':
        patch.startedAt = now;
        patch.checkInAt = visit.checkInAt ?? now;
        patch.checkInLat = visit.checkInLat ?? null;
        patch.checkInLng = visit.checkInLng ?? null;
        break;
      case 'DONE':
        patch.completedAt = now;
        patch.checkOutAt = visit.checkOutAt ?? now;
        patch.checkOutLat = visit.checkOutLat ?? null;
        patch.checkOutLng = visit.checkOutLng ?? null;
        break;
      case 'CANCELED':
        patch.canceledAt = now;
        patch.cancelReason = dto.cancelReason ?? 'N/A';
        break;
      case 'NO_SHOW':
        patch.completedAt = now;
        break;
    }

    const updated = await this.prisma.visit.update({
      where: { id },
      data: patch,
      include: { client: true, technician: true },
    });

    if (dto.status === VisitStatus.DONE) {
      const payload: VisitCompletedEvent = {
        visitId: updated.id,
        completedAtIso: (updated.completedAt ?? now).toISOString(),
        client: {
          name: updated.client.name,
          email: updated.client.email,
          address: updated.client.address ?? undefined,
        },
        technician: {
          name: updated.technician.displayName,
          email: updated.technician.email ?? undefined,
        },
        notes: updated.notes ?? undefined,
        summaryHtml: updated.reportData ? `<pre>${JSON.stringify(updated.reportData, null, 2)}</pre>` : undefined,
      };
      await this.notificationsQueue.enqueueVisitCompleted(payload);
    }

    return this.toVisitSummary(updated as any);
  }

  async complete(id: string, auth: { keycloakSub: string; roles: string[] }) {
    return this.updateStatus(id, { status: VisitStatus.DONE }, auth);
  }
}
