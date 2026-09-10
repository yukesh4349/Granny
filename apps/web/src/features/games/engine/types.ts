// ============================================================================
// Cognitive Game Engine — Shared interface for all 10 games
// ============================================================================

/** Difficulty parameters returned by the AI difficulty service */
export interface DifficultyParams {
  difficulty: number;      // 1–5
  itemCount: number;       // Number of items in the round
  delaySeconds: number;    // Time to memorize before hiding
  distractorCount: number; // Number of decoy/distractor items
}

/** State of an active game session */
export interface SessionState {
  sessionId: string;
  userId: string;
  gameKey: string;
  difficulty: DifficultyParams;
  currentItemIndex: number;
  items: GameItem[];
  startedAt: Date;
  attempts: AttemptResult[];
}

/** A single game item (question/prompt/challenge) */
export interface GameItem {
  index: number;
  type: 'select' | 'order' | 'match' | 'recall' | 'identify';
  prompt: string;              // Text/voice prompt for the elder
  imageUrl?: string;           // Optional visual
  choices?: string[];          // Multiple choice options
  correctAnswer: string | string[];  // Correct answer(s)
  metadata?: Record<string, any>;    // Game-specific data
}

/** Result of a single attempt */
export interface AttemptResult {
  itemIndex: number;
  correct: boolean;
  latencyMs: number;
  errorType?: string;  // "wrong_position" | "wrong_name" | "timeout" | "skip"
  response: string;
}

/** Summary when a session ends */
export interface SessionSummary {
  sessionId: string;
  gameKey: string;
  totalItems: number;
  correctCount: number;
  accuracy: number;
  averageLatencyMs: number;
  score: number;
  nextDifficulty?: DifficultyParams;
}

/** The shared game contract — all 10 games implement this */
export interface CognitiveGame {
  key: string;
  title: string;
  description: string;
  icon: string;              // Emoji icon
  primarySkills: string[];   // e.g. ['spatial-memory', 'visual-memory']
  color: string;             // Theme color for this game

  startSession(userId: string, difficulty: DifficultyParams): SessionState;
  getNextItem(session: SessionState): GameItem | null;
  submitAttempt(session: SessionState, response: string): AttemptResult;
  endSession(session: SessionState): SessionSummary;
}

// ============================================================================
// Utility Functions
// ============================================================================

/** Generate a unique session ID */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/** Shuffle an array (Fisher-Yates) */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/** Pick N random items from an array */
export function pickRandom<T>(array: T[], count: number): T[] {
  return shuffleArray(array).slice(0, Math.min(count, array.length));
}

/** Calculate session summary */
export function calculateSummary(session: SessionState): SessionSummary {
  const correctCount = session.attempts.filter(a => a.correct).length;
  const totalLatency = session.attempts.reduce((sum, a) => sum + a.latencyMs, 0);

  return {
    sessionId: session.sessionId,
    gameKey: session.gameKey,
    totalItems: session.items.length,
    correctCount,
    accuracy: session.items.length > 0 ? Math.round((correctCount / session.items.length) * 100) : 0,
    averageLatencyMs: session.attempts.length > 0 ? Math.round(totalLatency / session.attempts.length) : 0,
    score: correctCount * 10 * session.difficulty.difficulty,
  };
}
