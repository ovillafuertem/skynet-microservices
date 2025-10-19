import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { PdfService } from '../providers/pdf.service';
import { MailService } from '../providers/mail.service';
export declare class VisitCompletedProcessor implements OnModuleInit, OnModuleDestroy {
    private readonly config;
    private readonly pdfService;
    private readonly mailService;
    private readonly queue;
    private readonly logger;
    private worker?;
    constructor(config: ConfigService, pdfService: PdfService, mailService: MailService, queue: Queue);
    onModuleInit(): void;
    onModuleDestroy(): Promise<void>;
    private handleJob;
    private buildEmailHtml;
}
