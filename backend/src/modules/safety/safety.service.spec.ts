// ============================================================================
// Unit Tests for SafetyService
// ============================================================================
import { SafetyService } from './safety.service';

describe('SafetyService', () => {
  let service: SafetyService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      safetyIncident: {
        create: jest.fn().mockResolvedValue({
          id: 'incident-1',
          userId: 'elder-1',
          triggerText: 'help me please',
          emotion: 'distressed',
          severity: 'high',
          alertsSent: false,
          createdAt: new Date(),
        }),
        update: jest.fn().mockResolvedValue({
          id: 'incident-1',
          alertsSent: true,
        }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'elder-1',
          name: 'Margaret',
          familyGroupId: 'fam-1',
          familyGroup: {
            members: [
              { id: 'caregiver-1', name: 'Rahul', role: 'CAREGIVER' },
            ],
          },
        }),
      },
    };
    service = new SafetyService(mockPrisma);
  });

  it('records safety incident and flags de-escalation', async () => {
    const result = await service.handleDistress('elder-1', 'help me please');
    expect(result).toBeDefined();
    expect(result.deEscalationSent).toBe(true);
    expect(result.caregiverAlerted).toBe(true);
    expect(mockPrisma.safetyIncident.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'elder-1',
          triggerText: 'help me please',
        }),
      })
    );
  });
});
