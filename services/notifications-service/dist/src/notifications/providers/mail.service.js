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
var MailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer_1 = __importDefault(require("nodemailer"));
let MailService = MailService_1 = class MailService {
    config;
    logger = new common_1.Logger(MailService_1.name);
    transporter;
    defaultFrom;
    constructor(config) {
        this.config = config;
        const host = config.get('SMTP_HOST', 'localhost');
        const port = parseInt(config.get('SMTP_PORT') ?? '1025', 10);
        const user = config.get('SMTP_USER');
        const pass = config.get('SMTP_PASS');
        this.defaultFrom = config.get('MAIL_FROM', 'no-reply@skynet.local');
        const auth = user ? { user, pass } : undefined;
        this.transporter = nodemailer_1.default.createTransport({
            host,
            port,
            secure: false,
            ...(auth ? { auth } : {}),
        });
    }
    async sendVisitSummary(payload) {
        if (!payload.to) {
            this.logger.warn('Skipping email for visit because destination address is missing');
            return;
        }
        await this.transporter.sendMail({
            from: this.defaultFrom,
            to: payload.to,
            subject: payload.subject,
            html: payload.html,
            attachments: payload.pdf
                ? [
                    {
                        filename: payload.filename ?? 'visit-summary.pdf',
                        content: payload.pdf,
                    },
                ]
                : undefined,
        });
        this.logger.log(`Notification email sent to ${payload.to}`);
    }
};
exports.MailService = MailService;
exports.MailService = MailService = MailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], MailService);
//# sourceMappingURL=mail.service.js.map