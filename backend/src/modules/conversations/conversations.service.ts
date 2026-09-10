// ============================================================================
// Conversation Service — Proxy to AI microservice for empathetic conversation
// ============================================================================
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SendMessageDto } from './conversations.dto';

@Injectable()
export class ConversationsService {
  private aiServiceUrl: string;

  constructor(private prisma: PrismaService) {
    this.aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
  }

  async sendMessage(userId: string, dto: SendMessageDto) {
    // Get or create conversation
    let conversationId = dto.conversationId;
    if (!conversationId) {
      const conversation = await this.prisma.conversation.create({
        data: { userId },
      });
      conversationId = conversation.id;
    }

    // Save user message
    await this.prisma.message.create({
      data: {
        conversationId,
        sender: 'user',
        text: dto.text,
        audioUrl: dto.audioUrl,
      },
    });

    // Get session history for context
    const history = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });

    // Proxy to AI service
    let reply = 'I\'m here to help you, dear. Could you tell me more?';
    let emotion = 'calm';
    let distressFlag = false;
    let suggestedAction: string | undefined;

    try {
      const response = await fetch(`${this.aiServiceUrl}/converse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          text: dto.text,
          sessionHistory: history.map(m => ({
            role: m.sender,
            content: m.text,
          })),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        reply = result.reply || reply;
        emotion = result.emotion || emotion;
        distressFlag = result.distressFlag || false;
        suggestedAction = result.suggestedAction;
      }
    } catch {
      // Use fallback response
    }

    // Save assistant response
    const assistantMessage = await this.prisma.message.create({
      data: {
        conversationId,
        sender: 'assistant',
        text: reply,
        emotion,
        distressFlag,
      },
    });

    return {
      reply,
      emotion,
      distressFlag,
      suggestedAction,
      conversationId,
      messageId: assistantMessage.id,
    };
  }

  async getConversations(userId: string, limit = 20) {
    return this.prisma.conversation.findMany({
      where: { userId },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getConversation(id: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');
    return conversation;
  }
}
