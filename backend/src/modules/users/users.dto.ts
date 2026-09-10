// ============================================================================
// Users DTOs
// ============================================================================
export class UpdateUserDto {
  name?: string;
  language?: string;
  familyGroupId?: string;
}

export class UpdateProfileDto {
  dateOfBirth?: string;
  ageGroup?: string;
  interests?: string[];
  cognitiveLvl?: number;
  culturalTags?: string[];
  voiceTone?: string;
  emergencyContact?: string;
  medicalNotes?: string;
}

export class CreateFamilyGroupDto {
  name: string;
}

export class LinkFamilyDto {
  userId: string;
  familyGroupId: string;
}

export class GrantConsentDto {
  elderId: string;
  caregiverId: string;
  scope: string;
  granted: boolean;
}
