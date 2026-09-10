// ============================================================================
// Ownership Guard — Verify caller owns the resource or is a linked caregiver
// ============================================================================
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const targetUserId = request.params.userId || request.body?.userId;

    if (!user || !targetUserId) {
      return true; // No ownership check needed if no target user
    }

    // Owner can always access their own resources
    if (user.sub === targetUserId) {
      return true;
    }

    // Caregivers can access linked elders' resources with consent
    if (user.role === 'CAREGIVER') {
      const elder = await this.prisma.user.findUnique({
        where: { id: targetUserId },
      });

      if (elder && elder.familyGroupId && elder.familyGroupId === user.familyGroupId) {
        // Check if caregiver has consent
        const consent = await this.prisma.consentRecord.findFirst({
          where: {
            elderId: targetUserId,
            caregiverId: user.sub,
            granted: true,
            revokedAt: null,
          },
        });

        if (consent) {
          return true;
        }
      }
    }

    throw new ForbiddenException('You do not have permission to access this resource');
  }
}
