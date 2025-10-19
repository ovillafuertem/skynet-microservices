import { Body, Controller, Post } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { VisitCompletedEventDto } from './dto/visit-completed.event';
import { ApiTags, ApiOperation, ApiCreatedResponse } from '@nestjs/swagger';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Post('visit-completed')
  @ApiOperation({ summary: 'Publica un evento visit.completed en la cola para pruebas manuales' })
  @ApiCreatedResponse({ description: 'Evento encolado' })
  async enqueue(@Body() payload: VisitCompletedEventDto) {
    await this.notifications.enqueueVisitCompleted(payload);
    return { enqueued: true };
  }
}
