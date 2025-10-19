import { ConfigService } from '@nestjs/config';
export interface VisitMailPayload {
    to?: string | null;
    subject: string;
    html: string;
    pdf?: Buffer;
    filename?: string;
}
export declare class MailService {
    private readonly config;
    private readonly logger;
    private readonly transporter;
    private readonly defaultFrom;
    constructor(config: ConfigService);
    sendVisitSummary(payload: VisitMailPayload): Promise<void>;
}
