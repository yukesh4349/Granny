// ============================================================================
// Memory Service — CRUD + proxy to AI for embeddings
// ============================================================================
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateMemoryDto, SearchMemoryDto } from './memory.dto';

@Injectable()
export class MemoryService {
  private aiServiceUrl: string;

  constructor(private prisma: PrismaService) {
    this.aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
  }

  async create(userId: string, dto: CreateMemoryDto, addedBy: string = 'ELDER') {
    const memory = await this.prisma.memory.create({
      data: {
        userId,
        type: dto.type,
        title: dto.title,
        content: dto.content,
        tags: dto.tags || [],
        imageUrl: dto.imageUrl,
        addedBy,
      },
    });

    // Proxy to AI service for embedding (non-blocking)
    this.embedMemory(memory.id, dto.content).catch(err =>
      console.error('[Memory] Embedding failed:', err.message),
    );

    return memory;
  }

  async findAll(userId: string, limit = 50, offset = 0) {
    return this.prisma.memory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async findById(id: string) {
    const memory = await this.prisma.memory.findUnique({ where: { id } });
    if (!memory) throw new NotFoundException('Memory not found');
    return memory;
  }

  async delete(id: string) {
    return this.prisma.memory.delete({ where: { id } });
  }

  async search(userId: string, dto: SearchMemoryDto) {
    try {
      // Try AI-powered semantic search
      const response = await fetch(`${this.aiServiceUrl}/memory/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, query: dto.query, limit: dto.limit || 5 }),
      });
      if (response.ok) return response.json();
    } catch {
      // Fallback to basic text search
    }

    return this.prisma.memory.findMany({
      where: {
        userId,
        OR: [
          { content: { contains: dto.query, mode: 'insensitive' } },
          { title: { contains: dto.query, mode: 'insensitive' } },
          { tags: { has: dto.query } },
        ],
      },
      take: dto.limit || 5,
      orderBy: { createdAt: 'desc' },
    });
  }

  private async embedMemory(memoryId: string, content: string) {
    try {
      const response = await fetch(`${this.aiServiceUrl}/memory/embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memoryId, text: content }),
      });
      if (response.ok) {
        const result = await response.json();
        await this.prisma.memory.update({
          where: { id: memoryId },
          data: { embeddingRef: result.embeddingRef },
        });
      }
    } catch (err) {
      console.error('[Memory] Embed request failed:', err);
    }
  }
}
