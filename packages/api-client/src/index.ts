// ============================================================================
// @elderly-ai/api-client — Shared Typed API Client for Granny Platform
// ============================================================================
import type { User, ElderProfile, Memory, GameSession, ConversationTurn, Reminder, SafetyIncident } from '@elderly-ai/types';

export class GrannyApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = 'http://localhost:4000') {
    this.baseUrl = baseUrl;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: 'API request failed' }));
      throw new Error(err.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // ─── Auth ───────────────────────────────────────────────────────────────────
  async sendOtp(phone: string) {
    return this.request<{ message: string; otp?: string }>('/auth/otp/send', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  }

  async verifyOtp(phone: string, otp: string) {
    return this.request<{ accessToken: string; user: User }>('/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ phone, otp }),
    });
  }

  // ─── Conversation ───────────────────────────────────────────────────────────
  async converse(text: string, sessionHistory: any[] = []) {
    return this.request<{ reply: string; emotion: string; distressFlag: boolean }>('/conversation', {
      method: 'POST',
      body: JSON.stringify({ text, sessionHistory }),
    });
  }

  // ─── Games ──────────────────────────────────────────────────────────────────
  async startGame(gameKey: string) {
    return this.request<GameSession>('/games/session/start', {
      method: 'POST',
      body: JSON.stringify({ gameKey }),
    });
  }

  async submitAttempt(sessionId: string, attempt: { itemIndex: number; correct: boolean; latencyMs: number; errorType?: string }) {
    return this.request<any>('/games/attempt', {
      method: 'POST',
      body: JSON.stringify({ sessionId, ...attempt }),
    });
  }

  async getDifficulty(gameKey: string, recentAttempts: any[] = []) {
    return this.request<any>(`/games/difficulty?gameKey=${gameKey}`);
  }

  // ─── Reminders ──────────────────────────────────────────────────────────────
  async getTodayReminders() {
    return this.request<Reminder[]>('/reminders/today');
  }

  async confirmReminder(reminderId: string) {
    return this.request<{ success: boolean; message: string }>(`/reminders/${reminderId}/confirm`, {
      method: 'POST',
    });
  }

  // ─── Memories ───────────────────────────────────────────────────────────────
  async getMemories() {
    return this.request<Memory[]>('/memory');
  }

  async addMemory(memory: { type: string; content: string }) {
    return this.request<Memory>('/memory', {
      method: 'POST',
      body: JSON.stringify(memory),
    });
  }

  // ─── Family Circle ──────────────────────────────────────────────────────────
  async getCaregiverDashboard(elderId?: string) {
    const query = elderId ? `?elderId=${elderId}` : '';
    return this.request<any>(`/family/dashboard${query}`);
  }
}

export const createApiClient = (baseUrl?: string) => new GrannyApiClient(baseUrl);
