// ============================================================================
// Personalization Service — Calibration of user difficulty & preferences
// ============================================================================
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UpdatePreferencesDto } from './personalization.dto';

@Injectable()
export class PersonalizationService {
  constructor(private prisma: PrismaService) {}

  async getUserPreferences(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return {
      userId: user.id,
      language: user.language,
      cognitiveLevel: user.profile?.cognitiveLvl || 3,
      interests: user.profile?.interests || [],
      culturalTags: user.profile?.culturalTags || [],
      voiceTone: user.profile?.voiceTone || 'warm_compassionate',
    };
  }

  async updatePreferences(userId: string, dto: UpdatePreferencesDto) {
    if (dto.language) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { language: dto.language },
      });
    }

    if (
      dto.cognitiveLevel !== undefined ||
      dto.voiceTone ||
      dto.interests ||
      dto.culturalTags
    ) {
      await (this.prisma as any).elderProfile.upsert({
        where: { userId },
        update: {
          cognitiveLvl: dto.cognitiveLevel,
          voiceTone: dto.voiceTone,
          interests: dto.interests,
          culturalTags: dto.culturalTags,
        },
        create: {
          userId,
          cognitiveLvl: dto.cognitiveLevel || 3,
          voiceTone: dto.voiceTone || 'warm_compassionate',
          interests: dto.interests || [],
          culturalTags: dto.culturalTags || [],
        },
      });
    }

    return this.getUserPreferences(userId);
  }
}
