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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var VisitCompletedProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VisitCompletedProcessor = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const bullmq_1 = require("bullmq");
const queue_module_1 = require("../../queue/queue.module");
const queue_constants_1 = require("../../queue/queue.constants");
const pdf_service_1 = require("../providers/pdf.service");
const mail_service_1 = require("../providers/mail.service");
const redis_utils_1 = require("../../shared/redis.utils");
let VisitCompletedProcessor = VisitCompletedProcessor_1 = class VisitCompletedProcessor {
    config;
    pdfService;
    mailService;
    queue;
    logger = new common_1.Logger(VisitCompletedProcessor_1.name);
    worker;
    constructor(config, pdfService, mailService, queue) {
        this.config = config;
        this.pdfService = pdfService;
        this.mailService = mailService;
        this.queue = queue;
    }
    onModuleInit() {
        const connection = (0, redis_utils_1.buildRedisConnection)(this.config);
        this.worker = new bullmq_1.Worker(queue_constants_1.VISIT_COMPLETED_QUEUE_NAME, async (job) => {
            await this.handleJob(job);
        }, { connection });
        this.worker.on('completed', (job) => {
            this.logger.log(`visit.completed processed (jobId=${job.id})`);
        });
        this.worker.on('failed', (job, err) => {
            this.logger.error(`visit.completed failed (jobId=${job?.id}): ${err?.message}`, err?.stack);
        });
        this.logger.log(`VisitCompletedProcessor ready (queue=${this.queue.name})`);
    }
    async onModuleDestroy() {
        if (this.worker) {
            await this.worker.close();
            this.logger.log('VisitCompletedProcessor stopped');
        }
    }
    async handleJob(job) {
        const payload = job.data;
        this.logger.debug(`Processing visit.completed for visit ${payload.visitId}`);
        const pdf = await this.pdfService.generateVisitSummary(payload);
        await this.mailService.sendVisitSummary({
            to: payload.client.email,
            subject: `Visita completada - ${payload.client.name}`,
            html: this.buildEmailHtml(payload),
            pdf,
            filename: `visit-${payload.visitId}.pdf`,
        });
    }
    buildEmailHtml(payload) {
        const completedAt = new Date(payload.completedAtIso).toLocaleString('es-GT', {
            dateStyle: 'medium',
            timeStyle: 'short',
        });
        return `
      <p>Hola ${payload.client.name},</p>
      <p>La visita asignada al técnico <strong>${payload.technician.name}</strong> fue completada el <strong>${completedAt}</strong>.</p>
      ${payload.notes ? `<p><strong>Notas del técnico:</strong> ${payload.notes}</p>` : ''}
      <p>Adjuntamos un PDF resumen para tu control.</p>
      <p>Saludos,<br/>Equipo SkyNet</p>
    `;
    }
};
exports.VisitCompletedProcessor = VisitCompletedProcessor;
exports.VisitCompletedProcessor = VisitCompletedProcessor = VisitCompletedProcessor_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, common_1.Inject)(queue_module_1.VISIT_COMPLETED_QUEUE)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        pdf_service_1.PdfService,
        mail_service_1.MailService,
        bullmq_1.Queue])
], VisitCompletedProcessor);
//# sourceMappingURL=visit-completed.processor.js.map