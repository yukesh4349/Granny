// ============================================================================
// Personalization DTOs — Cognitive calibrations and UI preferences
// ============================================================================
export class UpdatePreferencesDto {
  language?: string;
  fontSize?: number;
  highContrast?: boolean;
  cognitiveLevel?: number;
  voiceTone?: string;
  interests?: string[];
  culturalTags?: string[];
}
