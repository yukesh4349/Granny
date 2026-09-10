// ============================================================================
// Games Service — Game catalog, sessions, attempts, difficulty proxy
// ============================================================================
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { StartSessionDto, SubmitAttemptDto, EndSessionDto } from './games.dto';

// Default game catalog (seeded on first access)
const GAME_CATALOG = [
  { key: 'remember_my_home', name: 'Remember My Home' },
  { key: 'memory_market', name: 'Memory Market' },
  { key: 'name_face_match', name: 'Name & Face Match' },
  { key: 'recipe_recall', name: 'Recipe Recall' },
  { key: 'memory_journey', name: 'Memory Journey' },
  { key: 'complete_the_tune', name: 'Complete the Tune' },
  { key: 'story_detective', name: 'Story Detective' },
  { key: 'where_did_i_keep_it', name: 'Where Did I Keep It' },
  { key: 'memory_garden', name: 'Memory Garden' },
  { key: 'memory_album', name: 'Memory Album' },
];

@Injectable()
export class GamesService {
  private aiServiceUrl: string;

  constructor(private prisma: PrismaService) {
    this.aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    this.seedGames();
  }

  private async seedGames() {
    for (const game of GAME_CATALOG) {
      await this.prisma.game.upsert({
        where: { key: game.key },
        update: {},
        create: game,
      }).catch(() => {});
    }
  }

  async getGameCatalog() {
    return this.prisma.game.findMany();
  }

  async startSession(userId: string, dto: StartSessionDto) {
    // Get next difficulty from AI service or use default
    let difficulty = dto.difficulty || 3;
    try {
      const recentAttempts = await this.prisma.attempt.findMany({
        where: { session: { userId, gameKey: dto.gameKey } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      const response = await fetch(`${this.aiServiceUrl}/difficulty/next`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          gameKey: dto.gameKey,
          recentAttempts: recentAttempts.map(a => ({
            correct: a.correct,
            latencyMs: a.latencyMs,
            errorType: a.errorType,
          })),
        }),
      });
      if (response.ok) {
        const result = await response.json();
        difficulty = result.difficulty || difficulty;
      }
    } catch {
      // Use default difficulty
    }

    return this.prisma.gameSession.create({
      data: {
        userId,
        gameKey: dto.gameKey,
        difficulty,
      },
    });
  }

  async submitAttempt(dto: SubmitAttemptDto) {
    const session = await this.prisma.gameSession.findUnique({
      where: { id: dto.sessionId },
    });
    if (!session) throw new NotFoundException('Game session not found');

    return this.prisma.attempt.create({
      data: {
        sessionId: dto.sessionId,
        itemIndex: dto.itemIndex,
        correct: dto.correct,
        latencyMs: dto.latencyMs,
        errorType: dto.errorType,
      },
    });
  }

  async endSession(dto: EndSessionDto) {
    const session = await this.prisma.gameSession.findUnique({
      where: { id: dto.sessionId },
      include: { attempts: true },
    });
    if (!session) throw new NotFoundException('Game session not found');

    const score = dto.score || session.attempts.filter(a => a.correct).length;

    return this.prisma.gameSession.update({
      where: { id: dto.sessionId },
      data: {
        endedAt: new Date(),
        score,
      },
      include: { attempts: true },
    });
  }

  async getUserSessions(userId: string, gameKey?: string, limit = 20) {
    return this.prisma.gameSession.findMany({
      where: {
        userId,
        ...(gameKey ? { gameKey } : {}),
      },
      include: { attempts: true },
      orderBy: { startedAt: 'desc' },
      take: limit,
    });
  }

  async getSessionById(id: string) {
    const session = await this.prisma.gameSession.findUnique({
      where: { id },
      include: { attempts: true },
    });
    if (!session) throw new NotFoundException('Game session not found');
    return session;
  }
}
