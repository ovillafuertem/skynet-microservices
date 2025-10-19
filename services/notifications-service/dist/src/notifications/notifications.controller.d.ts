import { NotificationsService } from './notifications.service';
import { VisitCompletedEventDto } from './dto/visit-completed.event';
export declare class NotificationsController {
    private readonly notifications;
    constructor(notifications: NotificationsService);
    enqueue(payload: VisitCompletedEventDto): Promise<{
        enqueued: boolean;
    }>;
}
