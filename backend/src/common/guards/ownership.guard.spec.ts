// ============================================================================
// Unit Tests for OwnershipGuard
// ============================================================================
import { ForbiddenException } from '@nestjs/common';
import { OwnershipGuard } from './ownership.guard';

describe('OwnershipGuard', () => {
  let guard: OwnershipGuard;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
      },
      consentRecord: {
        findFirst: jest.fn(),
      },
    };
    guard = new OwnershipGuard(mockPrisma);
  });

  const createMockContext = (user: any, params: any = {}, body: any = {}) => ({
    switchToHttp: () => ({
      getRequest: () => ({ user, params, body }),
    }),
  } as any);

  it('allows owner to access own resource', async () => {
    const context = createMockContext(
      { sub: 'user-123', role: 'ELDER' },
      { userId: 'user-123' }
    );
    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('allows linked caregiver with active consent', async () => {
    const context = createMockContext(
      { sub: 'caregiver-456', role: 'CAREGIVER', familyGroupId: 'fam-1' },
      { userId: 'elder-789' }
    );

    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'elder-789',
      familyGroupId: 'fam-1',
    });

    mockPrisma.consentRecord.findFirst.mockResolvedValue({
      id: 'consent-1',
      elderId: 'elder-789',
      caregiverId: 'caregiver-456',
      granted: true,
      revokedAt: null,
    });

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('rejects caregiver without active consent', async () => {
    const context = createMockContext(
      { sub: 'caregiver-456', role: 'CAREGIVER', familyGroupId: 'fam-1' },
      { userId: 'elder-789' }
    );

    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'elder-789',
      familyGroupId: 'fam-1',
    });

    mockPrisma.consentRecord.findFirst.mockResolvedValue(null);

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('rejects unauthorized foreign user', async () => {
    const context = createMockContext(
      { sub: 'intruder-999', role: 'ELDER' },
      { userId: 'elder-789' }
    );

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });
});
