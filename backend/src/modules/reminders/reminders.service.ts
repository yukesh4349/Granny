// ============================================================================
// Reminders Service — CRUD + confirmation logging
// ============================================================================
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateReminderDto, UpdateReminderDto } from './reminders.dto';

@Injectable()
export class RemindersService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateReminderDto) {
    return this.prisma.reminder.create({
      data: {
        userId,
        type: dto.type,
        title: dto.title,
        description: dto.description,
        scheduleCron: dto.scheduleCron,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.reminder.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findActive(userId: string) {
    return this.prisma.reminder.findMany({
      where: { userId, isActive: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async update(id: string, dto: UpdateReminderDto) {
    return this.prisma.reminder.update({
      where: { id },
      data: dto,
    });
  }

  async confirm(id: string) {
    const reminder = await this.prisma.reminder.findUnique({ where: { id } });
    if (!reminder) throw new NotFoundException('Reminder not found');

    return this.prisma.reminder.update({
      where: { id },
      data: { lastConfirmedAt: new Date() },
    });
  }

  async delete(id: string) {
    return this.prisma.reminder.delete({ where: { id } });
  }

  async getTodaySchedule(userId: string) {
    const reminders = await this.findActive(userId);

    // Parse cron expressions to determine today's schedule
    const now = new Date();
    const schedule = reminders.map(r => {
      const parts = r.scheduleCron.split(' ');
      const hour = parts.length > 1 ? parseInt(parts[1]) : 0;
      const minute = parts.length > 0 ? parseInt(parts[0]) : 0;

      const scheduledTime = new Date(now);
      scheduledTime.setHours(hour, minute, 0, 0);

      return {
        ...r,
        scheduledTime: scheduledTime.toISOString(),
        isPast: scheduledTime < now,
        isConfirmed: r.lastConfirmedAt && r.lastConfirmedAt > new Date(now.setHours(0, 0, 0, 0)),
      };
    });

    return schedule.sort((a, b) =>
      new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
    );
  }
}
