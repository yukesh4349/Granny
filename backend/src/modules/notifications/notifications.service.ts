// ============================================================================
// Notifications Service — Alerting & SOS Siren Dispatch
// ============================================================================
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateNotificationDto } from './notifications.dto';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async getNotifications(elderId?: string) {
    const where = elderId ? { elderId } : {};
    return (this.prisma as any).caretakerNotification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async createNotification(dto: CreateNotificationDto) {
    return (this.prisma as any).caretakerNotification.create({
      data: {
        elderId: dto.elderId,
        elderName: dto.elderName,
        type: dto.type,
        severity: dto.severity,
        title: dto.title,
        message: dto.message,
        transcriptExcerpt: dto.transcriptExcerpt,
        recommendation: dto.recommendation,
        emailSent: dto.emailSent || false,
        recipientEmail: dto.recipientEmail,
        isRead: false,
      },
    });
  }

  async markAsRead(id: string) {
    return (this.prisma as any).caretakerNotification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead(elderId?: string) {
    const where = elderId ? { elderId } : {};
    return (this.prisma as any).caretakerNotification.updateMany({
      where,
      data: { isRead: true },
    });
  }

  async clearNotifications(elderId?: string) {
    const where = elderId ? { elderId } : {};
    return (this.prisma as any).caretakerNotification.deleteMany({
      where,
    });
  }
}
