import { Queue } from 'bullmq';
import type { VisitCompletedPayload } from './dto/visit-completed.event';
export declare class NotificationsService {
    private readonly queue;
    private readonly logger;
    constructor(queue: Queue);
    enqueueVisitCompleted(payload: VisitCompletedPayload): Promise<void>;
}
