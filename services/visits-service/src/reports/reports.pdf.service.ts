import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import puppeteer from 'puppeteer';
import { VisitReportData } from './reports.service';

@Injectable()
export class ReportsPdfService {
  private readonly logger = new Logger(ReportsPdfService.name);
  private readonly companyName: string;

  constructor(private readonly config: ConfigService) {
    this.companyName = config.get<string>('REPORTS_COMPANY_NAME', 'SkyNet S.A.');
  }

  reportFilename(data: VisitReportData) {
    const from = data.filters.from ? data.filters.from.substring(0, 10) : 'inicio';
    const to = data.filters.to ? data.filters.to.substring(0, 10) : 'hoy';
    return `visits-report-${from}-${to}.pdf`;
  }

  async generateVisitsPdf(data: VisitReportData): Promise<Buffer> {
    this.logger.debug('Generating visits report PDF');

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(this.buildHtml(data), { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({
        format: 'A4',
        margin: { top: '24mm', bottom: '24mm', left: '16mm', right: '16mm' },
      });
      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  private buildHtml(data: VisitReportData) {
    const summary = data.summary;

    const statusRows = Object.entries(summary.byStatus)
      .map(([status, count]) => `<tr><td>${status}</td><td>${count}</td></tr>`)
      .join('');

    const technicianRows = summary.technicians
      .map(
        (tech) => `
          <tr>
            <td>${tech.name}</td>
            <td>${tech.total}</td>
            <td>${tech.completed}</td>
          </tr>
        `,
      )
      .join('');

    const visitRows = data.rows
      .map(
        (row) => `
          <tr>
            <td>${row.id}</td>
            <td>${row.status}</td>
            <td>${this.formatDate(row.scheduledDate)}</td>
            <td>${row.completedAt ? this.formatDate(row.completedAt) : ''}</td>
            <td>${row.technician.name}</td>
            <td>${row.client.name}</td>
            <td>${row.notes ? this.escape(row.notes) : ''}</td>
          </tr>
        `,
      )
      .join('');

    return `
      <html lang="es">
        <head>
          <meta charset="utf-8" />
          <title>Reporte de visitas</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; color: #1f2937; }
            .container { padding: 24px 32px; }
            h1 { margin-bottom: 4px; }
            h2 { margin-top: 24px; margin-bottom: 8px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #e5e7eb; padding: 6px 8px; text-align: left; }
            th { background: #f3f4f6; }
            .muted { color: #6b7280; font-size: 12px; }
            .summary-grid { display: flex; gap: 24px; flex-wrap: wrap; }
            .summary-card { border: 1px solid #e5e7eb; padding: 12px 16px; border-radius: 6px; background: #f9fafb; min-width: 200px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>${this.companyName} — Reporte de visitas</h1>
            <p class="muted">Generado automáticamente el ${this.formatDate(new Date().toISOString(), true)}</p>

            <div class="summary-grid">
              <div class="summary-card">
                <strong>Total de registros</strong>
                <div style="font-size: 20px;">${summary.total}</div>
              </div>
              <div class="summary-card">
                <strong>Fechas</strong>
                <div>${data.filters.from ?? 'Inicio'} → ${data.filters.to ?? 'Actual'}</div>
              </div>
            </div>

            <h2>Resumen por estado</h2>
            <table>
              <thead><tr><th>Estado</th><th>Total</th></tr></thead>
              <tbody>${statusRows}</tbody>
            </table>

            <h2>Visitas por técnico</h2>
            <table>
              <thead><tr><th>Técnico</th><th>Visitas asignadas</th><th>Completadas</th></tr></thead>
              <tbody>${technicianRows || '<tr><td colspan="3">No hay datos</td></tr>'}</tbody>
            </table>

            <h2>Detalle</h2>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Estado</th>
                  <th>Programada</th>
                  <th>Finalizada</th>
                  <th>Técnico</th>
                  <th>Cliente</th>
                  <th>Notas</th>
                </tr>
              </thead>
              <tbody>${visitRows || '<tr><td colspan="7">No hay visitas dentro del filtro seleccionado.</td></tr>'}</tbody>
            </table>
          </div>
        </body>
      </html>
    `;
  }

  private formatDate(value: string, withTime = false) {
    const date = new Date(value);
    return date.toLocaleString('es-GT', {
      dateStyle: 'medium',
      timeStyle: withTime ? 'short' : undefined,
    });
  }

  private escape(value: string) {
    return value.replace(/[&<>"']/g, (char) => {
      const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
      };
      return map[char] ?? char;
    });
  }
}
