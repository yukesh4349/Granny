export type UserRole = 'ELDER' | 'CAREGIVER';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  phone?: string;
  language: string;
  avatar_url?: string;
  family_group_id?: string;
  caregiver_consent: boolean;
}

export interface ElderProfile {
  user_id: string;
  cognitive_level: number; // 1 to 5
  interests: string[];
  cultural_tags: string[];
  daily_streak: number;
  last_active_at?: string;
  emergency_contact_phone?: string;
  notes_for_ai?: string;
}

export type MemoryType = 'FAMILY' | 'PHOTO' | 'ROUTINE' | 'STORY' | 'FAVORITE' | 'EVENT';

export interface Memory {
  id: string;
  user_id: string;
  type: MemoryType;
  title: string;
  content: string;
  image_url?: string;
  tags: string[];
  added_by?: string;
  is_favorite: boolean;
  created_at: string;
}

export type GameKey =
  | 'remember-my-home'
  | 'memory-market'
  | 'name-face-match'
  | 'recipe-recall'
  | 'memory-journey'
  | 'complete-the-tune'
  | 'story-detective'
  | 'where-did-i-keep-it'
  | 'memory-garden'
  | 'memory-album';

export interface GameInfo {
  id: string;
  key: GameKey;
  name: string;
  description: string;
  icon: string;
  primary_skills: string[];
  min_level: number;
  max_level: number;
}

export interface AttemptLog {
  item_index: number;
  correct: boolean;
  latency_ms: number;
  error_type?: string;
}

export interface GameSession {
  id: string;
  user_id: string;
  game_key: GameKey;
  difficulty: number;
  score: number;
  max_score: number;
  completed: boolean;
  started_at: string;
  ended_at?: string;
  attempts: AttemptLog[];
}

export interface GameAsset {
  id: string;
  game_key: GameKey;
  image_url: string;
  thumbnail_url?: string;
  source: 'pexels' | 'pixabay' | 'dicebear' | 'pollinations' | 'user_upload';
  tags: string[];
  metadata?: Record<string, any>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  emotion?: 'warm' | 'comforting' | 'joyful' | 'attentive';
  distress_detected?: boolean;
  created_at: string;
}

export type ReminderType = 'MEDICATION' | 'WATER' | 'MEAL' | 'EXERCISE' | 'CALL_FAMILY' | 'CUSTOM';

export interface Reminder {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  type: ReminderType;
  time_of_day: string;
  is_active: boolean;
  last_confirmed_at?: string;
}
