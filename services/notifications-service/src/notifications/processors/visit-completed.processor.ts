import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job, Queue, Worker } from 'bullmq';
import { VISIT_COMPLETED_QUEUE } from '../../queue/queue.module';
import { VISIT_COMPLETED_QUEUE_NAME } from '../../queue/queue.constants';
import type { VisitCompletedPayload } from '../dto/visit-completed.event';
import { PdfService } from '../providers/pdf.service';
import { MailService } from '../providers/mail.service';
import { buildRedisConnection } from '../../shared/redis.utils';

@Injectable()
export class VisitCompletedProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(VisitCompletedProcessor.name);
  private worker?: Worker<VisitCompletedPayload>;

  constructor(
    private readonly config: ConfigService,
    private readonly pdfService: PdfService,
    private readonly mailService: MailService,
    @Inject(VISIT_COMPLETED_QUEUE) private readonly queue: Queue,
  ) {}

  onModuleInit() {
    const connection = buildRedisConnection(this.config);
    this.worker = new Worker<VisitCompletedPayload>(
      VISIT_COMPLETED_QUEUE_NAME,
      async (job) => {
        await this.handleJob(job);
      },
      { connection },
    );

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

  private async handleJob(job: Job<VisitCompletedPayload>) {
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

  private buildEmailHtml(payload: VisitCompletedPayload) {
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
}
