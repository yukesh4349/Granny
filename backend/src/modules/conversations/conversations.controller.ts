import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { SendMessageDto } from './conversations.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post('message')
  async sendMessage(
    @CurrentUser('sub') userId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.conversationsService.sendMessage(userId, dto);
  }

  @Get()
  async getConversations(
    @CurrentUser('sub') userId: string,
    @Query('limit') limit?: string,
  ) {
    return this.conversationsService.getConversations(userId, Number(limit) || 20);
  }

  @Get(':id')
  async getConversation(@Param('id') id: string) {
    return this.conversationsService.getConversation(id);
  }
}
