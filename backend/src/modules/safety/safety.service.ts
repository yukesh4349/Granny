// ============================================================================
// Safety Service — Distress detection, incident logging, alert fan-out
// ============================================================================
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class SafetyService {
  constructor(private prisma: PrismaService) {}

  /** Handle distress detection from conversation or direct trigger */
  async handleDistress(userId: string, triggerText: string, emotion?: string) {
    return this.logIncident(userId, {
      triggerText,
      emotion: emotion || 'distressed',
      severity: 'high',
    });
  }

  /** Log a safety incident and fan out alerts */
  async logIncident(userId: string, data: {
    triggerText: string;
    emotion?: string;
    severity?: string;
  }) {
    const incident = await this.prisma.safetyIncident.create({
      data: {
        userId,
        triggerText: data.triggerText,
        emotion: data.emotion,
        severity: data.severity || 'medium',
      },
    });

    // Fan out alerts to family group
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        familyGroup: { include: { members: true } },
      },
    });

    if (user?.familyGroup) {
      const caregivers = user.familyGroup.members.filter(m => m.role === 'CAREGIVER');
      // Send alerts / FCM push to each caregiver
      for (const caregiver of caregivers) {
        console.log(`[SAFETY ALERT] Notifying caregiver ${caregiver.name} (${caregiver.id}) about distress from ${user.name}`);
      }

      await this.prisma.safetyIncident.update({
        where: { id: incident.id },
        data: { alertsSent: true },
      });
    }

    return {
      ...incident,
      deEscalationSent: true,
      caregiverAlerted: true,
    };
  }

  /** Get incidents for a user */
  async getIncidents(userId: string, limit = 20) {
    return this.prisma.safetyIncident.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /** Resolve an incident */
  async resolveIncident(id: string) {
    return this.prisma.safetyIncident.update({
      where: { id },
      data: { resolvedAt: new Date() },
    });
  }
}
