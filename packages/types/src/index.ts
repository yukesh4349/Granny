// ============================================================================
// @elderly-ai/types — Shared Domain Types for Granny Platform
// ============================================================================

export type UserRole = 'ELDER' | 'CAREGIVER';

export interface User {
  id: string;
  role: UserRole;
  name: string;
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
}

export interface Memory {
  id: string;
  userId: string;
  type: 'fact' | 'anecdote' | 'photo' | 'routine';
  content: string;
  addedBy: 'ELDER' | 'CAREGIVER' | 'SYSTEM';
  createdAt: string;
}

export interface GameSession {
  id: string;
  userId: string;
  gameKey: string;
  difficulty: number;
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
  type: 'medication' | 'hydration' | 'activity';
  title?: string;
  scheduleCron: string;
  lastConfirmedAt?: string;
}

export interface SafetyIncident {
  id: string;
  userId: string;
  phraseMatched?: string;
  deEscalationSent: boolean;
  caregiverAlerted: boolean;
  createdAt: string;
}
