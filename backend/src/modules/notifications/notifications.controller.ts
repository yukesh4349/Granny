// ============================================================================
// Notifications Controller — REST endpoints for alerts and caretaker alarms
// ============================================================================
import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './notifications.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(@Query('elderId') elderId?: string) {
    return this.notificationsService.getNotifications(elderId);
  }

  @Post()
  async createNotification(@Body() dto: CreateNotificationDto) {
    return this.notificationsService.createNotification(dto);
  }

  @Put(':id/read')
  async markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @Post('read-all')
  async markAllAsRead(@Query('elderId') elderId?: string) {
    return this.notificationsService.markAllAsRead(elderId);
  }

  @Delete('clear')
  async clearNotifications(@Query('elderId') elderId?: string) {
    return this.notificationsService.clearNotifications(elderId);
  }
}
