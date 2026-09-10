// ============================================================================
// Family Service — Caregiver dashboard data
// ============================================================================
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class FamilyService {
  constructor(private prisma: PrismaService) {}

  /** Get adherence percentage (confirmed reminders / total active reminders) */
  async getAdherence(elderId: string) {
    const reminders = await this.prisma.reminder.findMany({
      where: { userId: elderId, isActive: true },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const confirmed = reminders.filter(r =>
      r.lastConfirmedAt && r.lastConfirmedAt >= today
    ).length;

    return {
      total: reminders.length,
      confirmed,
      percentage: reminders.length > 0 ? Math.round((confirmed / reminders.length) * 100) : 0,
    };
  }

  /** Get mood trend from recent conversation emotions */
  async getMoodTrend(elderId: string, days = 7) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const messages = await this.prisma.message.findMany({
      where: {
        conversation: { userId: elderId },
        sender: 'user',
        emotion: { not: null },
        createdAt: { gte: since },
      },
      orderBy: { createdAt: 'asc' },
      select: { emotion: true, createdAt: true },
    });

    // Group by day
    const trend: Record<string, string[]> = {};
    messages.forEach(m => {
      const day = m.createdAt.toISOString().split('T')[0];
      if (!trend[day]) trend[day] = [];
      if (m.emotion) trend[day].push(m.emotion);
    });

    return Object.entries(trend).map(([date, emotions]) => ({
      date,
      dominantMood: this.dominantMood(emotions),
      emotions,
    }));
  }

  /** Get recent game performance */
  async getGamePerformance(elderId: string, limit = 10) {
    const sessions = await this.prisma.gameSession.findMany({
      where: { userId: elderId, endedAt: { not: null } },
      include: { attempts: true },
      orderBy: { startedAt: 'desc' },
      take: limit,
    });

    return sessions.map(s => ({
      id: s.id,
      gameKey: s.gameKey,
      difficulty: s.difficulty,
      score: s.score,
      totalAttempts: s.attempts.length,
      correctAttempts: s.attempts.filter(a => a.correct).length,
      accuracy: s.attempts.length > 0
        ? Math.round((s.attempts.filter(a => a.correct).length / s.attempts.length) * 100)
        : 0,
      playedAt: s.startedAt,
    }));
  }

  /** Get pending consent requests */
  async getPendingConsents(caregiverId: string) {
    return this.prisma.consentRecord.findMany({
      where: { caregiverId, granted: false, revokedAt: null },
    });
  }

  /** Get safety incidents for family group */
  async getIncidents(elderId: string, limit = 10) {
    return this.prisma.safetyIncident.findMany({
      where: { userId: elderId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /** Get full dashboard data for a caregiver */
  async getDashboard(caregiverId: string, elderId: string) {
    const [adherence, moodTrend, gamePerformance, incidents] = await Promise.all([
      this.getAdherence(elderId),
      this.getMoodTrend(elderId),
      this.getGamePerformance(elderId),
      this.getIncidents(elderId),
    ]);

    return { adherence, moodTrend, gamePerformance, incidents };
  }

  private dominantMood(emotions: string[]): string {
    const counts: Record<string, number> = {};
    emotions.forEach(e => { counts[e] = (counts[e] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'calm';
  }
}
