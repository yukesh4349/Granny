// ============================================================================
// @elderly-ai/types — Shared Domain Types for Granny Platform
// ============================================================================

export type UserRole = 'ELDER' | 'CAREGIVER';

export interface User {
  id: string;
  role: UserRole;
  name: string;
  email?: string;
  phone?: string;
  language: string;
  familyGroupId?: string;
  createdAt: string;
}

export interface ElderProfile {
  id: string;
  userId: string;
  ageGroup?: string;
  interests: string[];
  cognitiveLvl: number;
  culturalTags: string[];
  emergencyContact?: string;
  medicalNotes?: string;
}

export interface Memory {
  id: string;
  userId: string;
  type: 'fact' | 'anecdote' | 'photo' | 'routine';
  title?: string;
  content: string;
  tags?: string[];
  imageUrl?: string;
  addedBy: 'ELDER' | 'CAREGIVER' | 'SYSTEM';
  createdAt: string;
}

export interface GameSession {
  id: string;
  userId: string;
  gameKey: string;
  difficulty: number;
  score?: number;
  startedAt: string;
  endedAt?: string;
  attempts: Attempt[];
}

export interface Attempt {
  id: string;
  sessionId: string;
  itemIndex: number;
  correct: boolean;
  latencyMs: number;
  errorType?: string;
  createdAt?: string;
}

export interface GameVideo {
  id: string;
  gameKey: string;
  title: string;
  titleTa?: string;
  youtubeId: string;
  durationSeconds: number;
  createdAt?: string;
}

export interface ConversationTurn {
  id: string;
  userId: string;
  role: 'user' | 'assistant';
  text: string;
  emotion?: 'happy' | 'sad' | 'confused' | 'distressed' | 'calm';
  distressFlag?: boolean;
  createdAt: string;
}

export interface Reminder {
  id: string;
  userId: string;
  type: 'medication' | 'hydration' | 'activity' | 'MEDICATION' | 'WATER' | 'MEAL' | 'EXERCISE' | 'CALL_FAMILY' | 'CUSTOM';
  title: string;
  description?: string;
  timeOfDay?: string;
  scheduleCron?: string;
  isActive?: boolean;
  confirmed?: boolean;
  lastConfirmedAt?: string;
  createdAt?: string;
}

export interface MedicalReport {
  id: string;
  elderId: string;
  title: string;
  doctorName: string;
  reportDate: string;
  category: 'Prescription' | 'Lab Test' | 'Doctor Visit' | 'Scan' | 'Vitals' | 'Other';
  fileUrl?: string;
  summary?: string;
  notes?: string;
  createdAt?: string;
}

export interface FamilyContact {
  id: string;
  elderId: string;
  name: string;
  relationship: string;
  phone: string;
  avatarEmoji?: string;
  photoUrl?: string;
  isEmergencyContact?: boolean;
  notes?: string;
  createdAt?: string;
}

export interface CareNote {
  id: string;
  elderId: string;
  title: string;
  conditionDetails: string;
  careInstructions: string;
  aiGuidance?: string;
  updatedAt?: string;
}

export interface CaretakerNotification {
  id: string;
  elderId: string;
  elderName: string;
  type: 'HEALTH_ALERT' | 'MISSED_MEDICATION' | 'MEMORY_SHARED' | 'DISTRESS' | 'GENERAL';
  severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  title: string;
  message: string;
  transcriptExcerpt?: string;
  recommendation?: string;
  emailSent: boolean;
  recipientEmail?: string;
  isRead: boolean;
  createdAt: string;
}

export interface SafetyIncident {
  id: string;
  userId: string;
  phraseMatched?: string;
  deEscalationSent: boolean;
  caregiverAlerted: boolean;
  createdAt: string;
}
