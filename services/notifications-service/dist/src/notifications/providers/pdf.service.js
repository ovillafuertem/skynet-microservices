"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var PdfService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const puppeteer_1 = __importDefault(require("puppeteer"));
let PdfService = PdfService_1 = class PdfService {
    config;
    logger = new common_1.Logger(PdfService_1.name);
    companyName;
    constructor(config) {
        this.config = config;
        this.companyName = config.get('PDF_COMPANY_NAME', 'SkyNet S.A.');
    }
    async generateVisitSummary(payload) {
        this.logger.debug(`Generating PDF summary for visit ${payload.visitId}`);
        const browser = await puppeteer_1.default.launch({
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
        }
        finally {
            await browser.close();
        }
    }
    buildHtml(payload) {
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
              ${payload.address
            ? `<tr><th>Dirección</th><td>${payload.address}</td></tr>`
            : ''}
              ${payload.notes
            ? `<tr><th>Notas</th><td>${payload.notes}</td></tr>`
            : ''}
            </table>

            ${payload.summaryHtml
            ? `<h2>Resumen del técnico</h2>${payload.summaryHtml}`
            : ''}

            <div class="footer">
              Reporte generado automáticamente por ${this.companyName}.
            </div>
          </div>
        </body>
      </html>
    `;
    }
};
exports.PdfService = PdfService;
exports.PdfService = PdfService = PdfService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], PdfService);
//# sourceMappingURL=pdf.service.js.map