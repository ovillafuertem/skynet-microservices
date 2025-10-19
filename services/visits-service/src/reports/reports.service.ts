import { Injectable } from '@nestjs/common';
import { Prisma, VisitStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { VisitReportQueryDto } from './dto/visit-report-query.dto';
import { ReportsPdfService } from './reports.pdf.service';

export interface VisitReportRow {
  id: string;
  status: VisitStatus;
  scheduledDate: string;
  completedAt?: string | null;
  technician: { id: string; name: string; email?: string | null };
  client: { id: string; name: string; email?: string | null };
  notes?: string | null;
}

export interface VisitReportSummary {
  total: number;
  byStatus: Record<VisitStatus, number> & { OTHER?: number };
  technicians: Array<{ id: string; name: string; total: number; completed: number }>;
}

export interface VisitReportData {
  filters: VisitReportQueryDto;
  summary: VisitReportSummary;
  rows: VisitReportRow[];
}

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService, private readonly pdf: ReportsPdfService) {}

  async getVisitsReport(query: VisitReportQueryDto): Promise<VisitReportData> {
    const where = this.buildWhere(query);

    const visits = await this.prisma.visit.findMany({
      where,
      include: {
        client: true,
        technician: true,
      },
      orderBy: this.buildOrder(query),
    });

    const rows: VisitReportRow[] = visits.map((visit) => ({
      id: visit.id,
      status: visit.status,
      scheduledDate: visit.scheduledDate.toISOString(),
      completedAt: visit.completedAt?.toISOString() ?? null,
      technician: {
        id: visit.technicianId,
        name: visit.technician?.displayName ?? '—',
        email: visit.technician?.email ?? null,
      },
      client: {
        id: visit.clientId,
        name: visit.client?.name ?? '—',
        email: visit.client?.email ?? null,
      },
      notes: visit.notes,
    }));

    const summary = this.buildSummary(rows);

    return { filters: query, summary, rows };
  }

  async getVisitsReportPdf(query: VisitReportQueryDto) {
    const data = await this.getVisitsReport(query);
    const buffer = await this.pdf.generateVisitsPdf(data);
    return { filename: this.pdf.reportFilename(data), buffer };
  }

  private buildWhere(query: VisitReportQueryDto) {
    const where: Prisma.VisitWhereInput = {};

    if (query.from || query.to) {
      where.scheduledDate = {};
      if (query.from) where.scheduledDate.gte = new Date(query.from);
      if (query.to) where.scheduledDate.lte = new Date(query.to);
    }

    if (query.status) where.status = query.status;
    if (query.technicianId) where.technicianId = query.technicianId;
    if (query.clientId) where.clientId = query.clientId;

    if (query.search) {
      where.OR = [
        { notes: { contains: query.search, mode: 'insensitive' } },
        { client: { name: { contains: query.search, mode: 'insensitive' } } },
        { technician: { displayName: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    return where;
  }

  private buildOrder(query: VisitReportQueryDto) {
    if (query.status === VisitStatus.DONE) {
      return [{ completedAt: 'desc' } as const, { scheduledDate: 'desc' } as const];
    }
    return [{ scheduledDate: 'desc' } as const];
  }

  private buildSummary(rows: VisitReportRow[]): VisitReportSummary {
    const statusTotals: Record<VisitStatus, number> & { OTHER?: number } = {
      PLANNED: 0,
      IN_PROGRESS: 0,
      DONE: 0,
      CANCELED: 0,
      NO_SHOW: 0,
    };

    const technicianMap = new Map<string, { id: string; name: string; total: number; completed: number }>();

    for (const row of rows) {
      statusTotals[row.status] = (statusTotals[row.status] ?? 0) + 1;

      const techKey = row.technician.id;
      if (!technicianMap.has(techKey)) {
        technicianMap.set(techKey, {
          id: techKey,
          name: row.technician.name,
          total: 0,
          completed: 0,
        });
      }

      const aggregate = technicianMap.get(techKey)!;
      aggregate.total += 1;
      if (row.status === VisitStatus.DONE) aggregate.completed += 1;
    }

    return {
      total: rows.length,
      byStatus: statusTotals,
      technicians: Array.from(technicianMap.values()).sort((a, b) => b.total - a.total),
    };
  }
}
