import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { RemindersService } from './reminders.service';
import { CreateReminderDto, UpdateReminderDto } from './reminders.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('reminders')
@UseGuards(JwtAuthGuard)
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Post()
  async create(@CurrentUser('sub') userId: string, @Body() dto: CreateReminderDto) {
    return this.remindersService.create(userId, dto);
  }

  @Get()
  async findAll(@CurrentUser('sub') userId: string) {
    return this.remindersService.findAll(userId);
  }

  @Get('today')
  async getTodaySchedule(@CurrentUser('sub') userId: string) {
    return this.remindersService.getTodaySchedule(userId);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateReminderDto) {
    return this.remindersService.update(id, dto);
  }

  @Post(':id/confirm')
  async confirm(@Param('id') id: string) {
    return this.remindersService.confirm(id);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.remindersService.delete(id);
  }
}
