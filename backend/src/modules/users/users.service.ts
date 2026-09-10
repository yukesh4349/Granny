// ============================================================================
// Users Service — User profile CRUD, family linking, consent
// ============================================================================
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UpdateUserDto, UpdateProfileDto, CreateFamilyGroupDto, GrantConsentDto } from './users.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateUser(id: string, dto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id },
      data: dto,
    });
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const data: any = { ...dto };
    if (dto.dateOfBirth) {
      data.dateOfBirth = new Date(dto.dateOfBirth);
    }

    return this.prisma.elderProfile.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });
  }

  async createFamilyGroup(dto: CreateFamilyGroupDto) {
    return this.prisma.familyGroup.create({
      data: { name: dto.name },
    });
  }

  async linkToFamily(userId: string, familyGroupId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { familyGroupId },
    });
  }

  async grantConsent(dto: GrantConsentDto) {
    // Find or create consent record
    const existing = await this.prisma.consentRecord.findFirst({
      where: {
        elderId: dto.elderId,
        caregiverId: dto.caregiverId,
        scope: dto.scope,
      },
    });

    if (existing) {
      return this.prisma.consentRecord.update({
        where: { id: existing.id },
        data: {
          granted: dto.granted,
          grantedAt: dto.granted ? new Date() : null,
          revokedAt: dto.granted ? null : new Date(),
        },
      });
    }

    // Need the elder's family group
    const elder = await this.prisma.user.findUnique({ where: { id: dto.elderId } });
    if (!elder?.familyGroupId) throw new NotFoundException('Elder has no family group');

    return this.prisma.consentRecord.create({
      data: {
        familyGroupId: elder.familyGroupId,
        elderId: dto.elderId,
        caregiverId: dto.caregiverId,
        scope: dto.scope,
        granted: dto.granted,
        grantedAt: dto.granted ? new Date() : null,
      },
    });
  }

  async getFamilyMembers(familyGroupId: string) {
    return this.prisma.user.findMany({
      where: { familyGroupId },
      include: { profile: true },
    });
  }
}
