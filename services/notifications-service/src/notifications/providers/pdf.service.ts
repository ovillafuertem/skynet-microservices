import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import puppeteer from 'puppeteer';
import type { VisitCompletedPayload } from '../dto/visit-completed.event';

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);
  private readonly companyName: string;

  constructor(private readonly config: ConfigService) {
    this.companyName = config.get<string>('PDF_COMPANY_NAME', 'SkyNet S.A.');
  }

  async generateVisitSummary(payload: VisitCompletedPayload): Promise<Buffer> {
    this.logger.debug(`Generating PDF summary for visit ${payload.visitId}`);

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      const html = this.buildHtml(payload);
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({
        format: 'A4',
        margin: {
          top: '32px',
          bottom: '32px',
          left: '24px',
          right: '24px',
        },
      });
      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  private buildHtml(payload: VisitCompletedPayload) {
    const completedDate = new Date(payload.completedAtIso);
    const localeDate = completedDate.toLocaleString('es-GT', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    return `
      <html lang="es">
        <head>
          <meta charset="utf-8" />
          <title>Resumen de visita</title>
          <style>
            body { font-family: Arial, sans-serif; color: #1f2937; margin: 0; padding: 0; }
            .container { padding: 24px 32px; }
            h1 { margin-bottom: 8px; font-size: 22px; color: #111827; }
            h2 { font-size: 18px; color: #111827; margin-top: 24px; margin-bottom: 12px; }
            p { line-height: 1.5; font-size: 14px; margin: 4px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { padding: 10px 12px; border: 1px solid #e5e7eb; text-align: left; font-size: 14px; }
            .muted { color: #6b7280; }
            .badge { display: inline-block; padding: 4px 8px; border-radius: 9999px; background: #2563eb; color: #fff; font-size: 12px; }
            .footer { margin-top: 32px; font-size: 12px; color: #9ca3af; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>${this.companyName}</h1>
            <p class="muted">Confirmación automática de visita completada.</p>

            <h2>Datos de la visita</h2>
            <table>
              <tr>
                <th>Cliente</th>
                <td>${payload.client.name}${payload.client.email ? `<br/><span class="muted">${payload.client.email}</span>` : ''}</td>
              </tr>
              <tr>
                <th>Técnico</th>
                <td>${payload.technician.name}${payload.technician.email ? `<br/><span class="muted">${payload.technician.email}</span>` : ''}</td>
              </tr>
              <tr>
                <th>Fecha de cierre</th>
                <td>${localeDate}</td>
              </tr>
              ${
                payload.address
                  ? `<tr><th>Dirección</th><td>${payload.address}</td></tr>`
                  : ''
              }
              ${
                payload.notes
                  ? `<tr><th>Notas</th><td>${payload.notes}</td></tr>`
                  : ''
              }
            </table>

            ${
              payload.summaryHtml
                ? `<h2>Resumen del técnico</h2>${payload.summaryHtml}`
                : ''
            }

            <div class="footer">
              Reporte generado automáticamente por ${this.companyName}.
            </div>
          </div>
        </body>
      </html>
    `;
  }
}
