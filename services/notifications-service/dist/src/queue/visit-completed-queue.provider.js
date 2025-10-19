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
var VisitCompletedQueueProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VisitCompletedQueueProvider = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const bullmq_1 = require("bullmq");
const queue_constants_1 = require("./queue.constants");
const redis_utils_1 = require("../shared/redis.utils");
let VisitCompletedQueueProvider = VisitCompletedQueueProvider_1 = class VisitCompletedQueueProvider {
    config;
    logger = new common_1.Logger(VisitCompletedQueueProvider_1.name);
    queue;
    constructor(config) {
        this.config = config;
        const connection = (0, redis_utils_1.buildRedisConnection)(config);
        this.queue = new bullmq_1.Queue(queue_constants_1.VISIT_COMPLETED_QUEUE_NAME, {
            connection,
            defaultJobOptions: {
                removeOnComplete: 50,
                removeOnFail: 50,
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 5000,
                },
            },
        });
    }
    async onModuleDestroy() {
        this.logger.log('Closing BullMQ queue…');
        await this.queue.close();
        this.logger.log('Queue closed');
    }
};
exports.VisitCompletedQueueProvider = VisitCompletedQueueProvider;
exports.VisitCompletedQueueProvider = VisitCompletedQueueProvider = VisitCompletedQueueProvider_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], VisitCompletedQueueProvider);
//# sourceMappingURL=visit-completed-queue.provider.js.map