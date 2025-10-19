import { ConfigService } from '@nestjs/config';
import type { VisitCompletedPayload } from '../dto/visit-completed.event';
export declare class PdfService {
    private readonly config;
    private readonly logger;
    private readonly companyName;
    constructor(config: ConfigService);
    generateVisitSummary(payload: VisitCompletedPayload): Promise<Buffer>;
    private buildHtml;
}
