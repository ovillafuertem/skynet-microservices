import { BadRequestException, Injectable } from '@nestjs/common';
import { CheckType, VisitStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { inCheckInWindow, inCheckOutWindow } from './validators/time-window.util';
import { haversineMeters } from './validators/geo-distance.util';

// Si tienes un DTO específico, importa su tipo:
import { CheckDto } from './dto/check.dto';

type IdemMeta = { ip?: string; idemKeyHash?: string };

@Injectable()
export class ChecksService {
  constructor(private readonly prisma: PrismaService) {}

  /** Config centralizada desde envs (con defaults seguros en dev). */
  private cfg() {
    return {
      earlyMin: parseInt(process.env.CHECKIN_EARLY_MIN ?? '30', 10),
      lateMin: parseInt(process.env.CHECKOUT_LATE_MIN ?? '60', 10),
      radius: parseInt(process.env.RADIUS_METERS ?? '150', 10),
      requireGeo: (process.env.REQUIRE_GEOFENCE ?? 'true') === 'true',
    };
  }

  /** Cargó visita con campos mínimos requeridos para reglas */
  private async loadVisitForChecks(visitId: string) {
    const visit = await this.prisma.visit.findUnique({
      where: { id: visitId },
      select: {
        id: true,
        technicianId: true,
        status: true,
        // Ventana/agenda de mi modelo actual
        scheduledDate: true,
        windowStart: true,
        windowEnd: true,
        // Geovalla a nivel visita (agregados en mi migración)
        plannedLat: true,
        plannedLng: true,
        // Fallback a coordenadas del cliente
        client: { select: { lat: true, lng: true } },
      },
    });

    if (!visit) throw new BadRequestException('Visit not found');
    return visit;
  }

  /** Ancla para geovalla: prioriza planned* de la visita, luego coords del cliente */
  private getGeoAnchor(visit: Awaited<ReturnType<typeof this.loadVisitForChecks>>) {
    const anchorLat = visit.plannedLat ?? visit.client?.lat ?? null;
    const anchorLng = visit.plannedLng ?? visit.client?.lng ?? null;
    return { anchorLat, anchorLng };
  }

  /** Normaliza la ventana de tiempo para evitar pasar null a las utils */
  private getTimeWindow(visit: Awaited<ReturnType<typeof this.loadVisitForChecks>>) {
    // Si tienes windowStart/windowEnd (opcionales), cae a scheduledDate.
    const start: Date = visit.windowStart ?? visit.scheduledDate;
    const end: Date = visit.windowEnd ?? visit.scheduledDate;
    return { start, end };
  }

  /** Verifico que no exista ya un check-in */
  private async ensureNoCheckIn(visitId: string) {
    const hasIn = await this.prisma.visitCheck.findFirst({
      where: { visitId, type: CheckType.CHECK_IN },
      select: { id: true },
    });
    if (hasIn) throw new BadRequestException('Visit already has check-in');
  }

  /** Verifico orden lógico para check-out */
  private async ensureOrderForCheckout(visitId: string) {
    const [inEvent, outEvent] = await Promise.all([
      this.prisma.visitCheck.findFirst({ where: { visitId, type: CheckType.CHECK_IN }, select: { id: true } }),
      this.prisma.visitCheck.findFirst({ where: { visitId, type: CheckType.CHECK_OUT }, select: { id: true } }),
    ]);
    if (!inEvent) throw new BadRequestException('Cannot check-out without a prior check-in');
    if (outEvent) throw new BadRequestException('Visit already has check-out');
  }

  /** Geovalla + distancia (opcional) */
  private computeDistanceOrThrow(
    dto: Pick<CheckDto, 'lat' | 'lng'>,
    anchorLat: number | null,
    anchorLng: number | null,
    requireGeo: boolean,
    radius: number,
  ): number | null {
    // Si geovalla es obligatoria: todo debe existir
    if (requireGeo) {
      if (dto.lat == null || dto.lng == null || anchorLat == null || anchorLng == null) {
        throw new BadRequestException('Outside geofence');
      }
      const distance = haversineMeters(dto.lat, dto.lng, anchorLat, anchorLng);
      if (distance > radius) throw new BadRequestException('Outside geofence');
      return distance;
    }

    // Geovalla no obligatoria: calcula distancia solo si tenemos todos los datos
    if (dto.lat != null && dto.lng != null && anchorLat != null && anchorLng != null) {
      return haversineMeters(dto.lat, dto.lng, anchorLat, anchorLng);
    }
    return null;
  }

  private async resolveTechnicianId(userSub: string | undefined) {
    if (!userSub) {
      throw new BadRequestException('Missing user identity');
    }
    let technician = await this.prisma.technician.findUnique({ where: { keycloakUserId: userSub } });
    if (!technician) {
      technician = await this.prisma.technician.create({
        data: {
          keycloakUserId: userSub,
          displayName: 'Técnico',
          email: null
        }
      });
    }
    return technician.id;
  }

  /** CHECK-IN */
  async checkIn(visitId: string, userSub: string, dto: CheckDto, meta: IdemMeta) {
    const { earlyMin, radius, requireGeo } = this.cfg();

    const visit = await this.loadVisitForChecks(visitId);
    const technicianId = await this.resolveTechnicianId(userSub);

    // Si no usas guard de ownership, valida aquí:
    // (Asume que el rol admin se maneja en un guard previo; si no, añade la lógica de roles)
    if (visit.technicianId !== technicianId) {
      throw new BadRequestException('Not assigned to this visit');
    }

    await this.ensureNoCheckIn(visitId);

    const now = new Date();
    const { start, end } = this.getTimeWindow(visit);
    if (!inCheckInWindow(now, start, end, earlyMin)) {
      throw new BadRequestException('Outside check-in time window');
    }

    const { anchorLat, anchorLng } = this.getGeoAnchor(visit);
    const distance = this.computeDistanceOrThrow(dto, anchorLat, anchorLng, requireGeo, radius);

    const created = await this.prisma.visitCheck.create({
      data: {
        visitId,
        type: CheckType.CHECK_IN,
        technicianId,
        occurredAt: now,
        deviceAt: dto.deviceAt ? new Date(dto.deviceAt) : null,
        lat: dto.lat ?? null,
        lng: dto.lng ?? null,
        distanceMeters: distance,
        source: dto.source ?? 'ONLINE',
        method: dto.method ?? 'GEO',
        verified: true,
        verificationMsg: 'OK',
        deviceId: dto.deviceId ?? null,
        ip: meta.ip ?? null,
        notes: dto.notes ?? null,
        photoUrl: dto.photoUrl ?? null,
        idemKeyHash: meta.idemKeyHash,
      },
    });

    // Actualiza estado de la visita
    await this.prisma.visit.update({
      where: { id: visitId },
      data: {
        status: VisitStatus.IN_PROGRESS,
        startedAt: now,
        checkInAt: now,
        checkInLat: dto.lat ?? null,
        checkInLng: dto.lng ?? null,
      },
    });

    return created;
  }

  /** CHECK-OUT */
  async checkOut(visitId: string, userSub: string, dto: CheckDto, meta: IdemMeta) {
    const { lateMin, radius, requireGeo } = this.cfg();

    const visit = await this.loadVisitForChecks(visitId);
    const technicianId = await this.resolveTechnicianId(userSub);

    // Ownership (si no hay guard)
    if (visit.technicianId !== technicianId) {
      throw new BadRequestException('Not assigned to this visit');
    }

    await this.ensureOrderForCheckout(visitId);

    const now = new Date();
    const { start, end } = this.getTimeWindow(visit);
    if (!inCheckOutWindow(now, start, end, lateMin)) {
      throw new BadRequestException('Outside check-out time window');
    }

    const { anchorLat, anchorLng } = this.getGeoAnchor(visit);
    const distance = this.computeDistanceOrThrow(dto, anchorLat, anchorLng, requireGeo, radius);

    const created = await this.prisma.visitCheck.create({
      data: {
        visitId,
        type: CheckType.CHECK_OUT,
        technicianId,
        occurredAt: now,
        deviceAt: dto.deviceAt ? new Date(dto.deviceAt) : null,
        lat: dto.lat ?? null,
        lng: dto.lng ?? null,
        distanceMeters: distance,
        source: dto.source ?? 'ONLINE',
        method: dto.method ?? 'GEO',
        verified: true,
        verificationMsg: 'OK',
        deviceId: dto.deviceId ?? null,
        ip: meta.ip ?? null,
        notes: dto.notes ?? null,
        photoUrl: dto.photoUrl ?? null,
        idemKeyHash: meta.idemKeyHash,
      },
    });

    // Actualiza estado (sin marcar como completada todavía)
    await this.prisma.visit.update({
      where: { id: visitId },
      data: {
        status: VisitStatus.IN_PROGRESS,
        checkOutAt: now,
        checkOutLat: dto.lat ?? null,
        checkOutLng: dto.lng ?? null,
      },
    });

    return created;
  }

  /** LISTAR eventos de una visita */
  async list(visitId: string) {
    return this.prisma.visitCheck.findMany({
      where: { visitId },
      orderBy: { occurredAt: 'asc' },
    });
  }
}
