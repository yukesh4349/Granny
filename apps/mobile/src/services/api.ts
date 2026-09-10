// ============================================================================
// Mobile API Client — Talks to Granny Backend and AI microservice
// ============================================================================

const BACKEND_URL = 'http://localhost:4000';
const AI_SERVICE_URL = 'http://localhost:8000';

export interface MobileChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  emotion?: string;
  distress?: boolean;
  timestamp: string;
}

export interface MobileReminder {
  id: string;
  type: string;
  time: string;
  title: string;
  details: string;
  confirmed: boolean;
}

export const mobileApi = {
  async converse(userId: string, text: string, sessionHistory: any[] = []): Promise<{ reply: string; emotion: string; distressFlag: boolean }> {
    try {
      const response = await fetch(`${AI_SERVICE_URL}/converse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, text, sessionHistory }),
      });
      if (!response.ok) throw new Error('AI Service error');
      return await response.json();
    } catch {
      // Offline fallback
      return {
        reply: "I am listening to you. Let's take our time together. How are you feeling right now?",
        emotion: 'calm',
        distressFlag: false,
      };
    }
  },

  async getNextDifficulty(userId: string, gameKey: string, recentAttempts: any[] = []) {
    try {
      const response = await fetch(`${AI_SERVICE_URL}/difficulty/next`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, gameKey, recentAttempts }),
      });
      if (!response.ok) throw new Error('Difficulty service error');
      return await response.json();
    } catch {
      return { difficulty: 3, itemCount: 4, delaySeconds: 7, distractorCount: 2 };
    }
  }
};
