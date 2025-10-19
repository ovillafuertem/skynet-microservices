"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueModule = exports.VISIT_COMPLETED_QUEUE = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const visit_completed_queue_provider_1 = require("./visit-completed-queue.provider");
exports.VISIT_COMPLETED_QUEUE = 'VISIT_COMPLETED_QUEUE';
let QueueModule = class QueueModule {
};
exports.QueueModule = QueueModule;
exports.QueueModule = QueueModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule],
        providers: [
            visit_completed_queue_provider_1.VisitCompletedQueueProvider,
            {
                provide: exports.VISIT_COMPLETED_QUEUE,
                useFactory: (provider) => provider.queue,
                inject: [visit_completed_queue_provider_1.VisitCompletedQueueProvider],
            },
        ],
        exports: [exports.VISIT_COMPLETED_QUEUE],
    })
], QueueModule);
//# sourceMappingURL=queue.module.js.map