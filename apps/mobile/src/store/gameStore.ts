import { create } from 'zustand';
import { GameKey, GameSession, AttemptLog, GameInfo } from '../types';
import { getNextDifficulty, DifficultyParameters } from '../services/difficultyEngine';

export const ALL_GAMES: GameInfo[] = [
  {
    id: '1',
    key: 'remember-my-home',
    name: 'Remember My Home',
    description: 'Place familiar objects into your living room, then recall where they belong.',
    icon: 'Home',
    primary_skills: ['Spatial Memory', 'Visual Recall'],
    min_level: 1,
    max_level: 5,
  },
  {
    id: '2',
    key: 'memory-market',
    name: 'Memory Market',
    description: 'Review fresh grocery items, then collect them from the market shelves.',
    icon: 'ShoppingCart',
    primary_skills: ['Short-Term Memory', 'Visual Recognition'],
    min_level: 1,
    max_level: 5,
  },
  {
    id: '3',
    key: 'name-face-match',
    name: 'Name & Face Match',
    description: 'Flip pairs of friendly family avatars to match faces with names.',
    icon: 'Users',
    primary_skills: ['Associative Memory', 'Face Recognition'],
    min_level: 1,
    max_level: 5,
  },
  {
    id: '4',
    key: 'recipe-recall',
    name: 'Recipe Recall',
    description: 'Sequence real cooking step photos in their natural kitchen order.',
    icon: 'Utensils',
    primary_skills: ['Sequential Memory', 'Executive Function'],
    min_level: 1,
    max_level: 5,
  },
  {
    id: '5',
    key: 'memory-journey',
    name: 'Memory Journey',
    description: 'Watch a scenic travel journey and reorder the landmark photos.',
    icon: 'Compass',
    primary_skills: ['Working Memory', 'Spatial Orientation'],
    min_level: 1,
    max_level: 5,
  },
  {
    id: '6',
    key: 'complete-the-tune',
    name: 'Complete the Tune',
    description: 'Listen to a soothing melody and pick the matching vinyl album cover.',
    icon: 'Music',
    primary_skills: ['Auditory Memory', 'Pattern Recognition'],
    min_level: 1,
    max_level: 5,
  },
  {
    id: '7',
    key: 'story-detective',
    name: 'Story Detective',
    description: 'Listen to a warm illustrated tale and tap the correct visual clue.',
    icon: 'BookOpen',
    primary_skills: ['Story Recall', 'Visual Comprehension'],
    min_level: 1,
    max_level: 5,
  },
  {
    id: '8',
    key: 'where-did-i-keep-it',
    name: 'Where Did I Keep It?',
    description: 'Spot the exact hotspot where your cherished item was kept.',
    icon: 'Eye',
    primary_skills: ['Spatial Attention', 'Precision Recall'],
    min_level: 1,
    max_level: 5,
  },
  {
    id: '9',
    key: 'memory-garden',
    name: 'Memory Garden',
    description: 'Plant flowers in your persistent garden and recall their positions.',
    icon: 'Flower2',
    primary_skills: ['Creative Memory', 'Spatial Cognition'],
    min_level: 1,
    max_level: 5,
  },
  {
    id: '10',
    key: 'memory-album',
    name: 'Memory Album',
    description: 'Browse photos and recognize which ones you have previously viewed.',
    icon: 'Image',
    primary_skills: ['Recognition Memory', 'Processing Speed'],
    min_level: 1,
    max_level: 5,
  },
];

interface GameState {
  games: GameInfo[];
  activeSession: GameSession | null;
  historyAttempts: Record<GameKey, AttemptLog[]>;
  allSessions: GameSession[];
  
  startGameSession: (userId: string, gameKey: GameKey, initialLevel?: number) => GameSession;
  recordAttempt: (correct: boolean, latencyMs: number, errorType?: string) => void;
  finishGameSession: (score: number) => void;
  getDifficultyForGame: (userId: string, gameKey: GameKey) => DifficultyParameters;
}

export const useGameStore = create<GameState>((set, get) => ({
  games: ALL_GAMES,
  activeSession: null,
  historyAttempts: {
    'remember-my-home': [{ item_index: 0, correct: true, latency_ms: 2200 }],
    'memory-market': [{ item_index: 0, correct: true, latency_ms: 1900 }],
    'name-face-match': [{ item_index: 0, correct: true, latency_ms: 2400 }],
    'recipe-recall': [{ item_index: 0, correct: true, latency_ms: 3100 }],
    'memory-journey': [{ item_index: 0, correct: true, latency_ms: 2800 }],
    'complete-the-tune': [{ item_index: 0, correct: true, latency_ms: 2100 }],
    'story-detective': [{ item_index: 0, correct: true, latency_ms: 2600 }],
    'where-did-i-keep-it': [{ item_index: 0, correct: true, latency_ms: 2900 }],
    'memory-garden': [{ item_index: 0, correct: true, latency_ms: 1800 }],
    'memory-album': [{ item_index: 0, correct: true, latency_ms: 2000 }],
  },
  allSessions: [
    {
      id: 'prev-session-1',
      user_id: 'usr-elder-001',
      game_key: 'memory-market',
      difficulty: 2,
      score: 95,
      max_score: 100,
      completed: true,
      started_at: new Date(Date.now() - 3600000 * 24).toISOString(),
      ended_at: new Date(Date.now() - 3600000 * 24 + 180000).toISOString(),
      attempts: [
        { item_index: 0, correct: true, latency_ms: 2100 },
        { item_index: 1, correct: true, latency_ms: 1800 },
        { item_index: 2, correct: true, latency_ms: 2300 },
      ],
    },
    {
      id: 'prev-session-2',
      user_id: 'usr-elder-001',
      game_key: 'remember-my-home',
      difficulty: 2,
      score: 90,
      max_score: 100,
      completed: true,
      started_at: new Date(Date.now() - 3600000 * 12).toISOString(),
      ended_at: new Date(Date.now() - 3600000 * 12 + 210000).toISOString(),
      attempts: [
        { item_index: 0, correct: true, latency_ms: 2400 },
        { item_index: 1, correct: true, latency_ms: 2900 },
      ],
    },
  ],

  startGameSession: (userId, gameKey, initialLevel = 1) => {
    const diff = get().getDifficultyForGame(userId, gameKey);
    const session: GameSession = {
      id: `session-${Date.now()}`,
      user_id: userId,
      game_key: gameKey,
      difficulty: diff.level,
      score: 0,
      max_score: 100,
      completed: false,
      started_at: new Date().toISOString(),
      attempts: [],
    };
    set({ activeSession: session });
    return session;
  },

  recordAttempt: (correct, latencyMs, errorType) => {
    const state = get();
    const session = state.activeSession;
    if (!session) return;

    const attempt: AttemptLog = {
      item_index: session.attempts.length,
      correct,
      latency_ms: latencyMs,
      error_type: errorType,
    };

    const updatedAttempts = [...session.attempts, attempt];
    const gameHistory = [...(state.historyAttempts[session.game_key] || []), attempt];

    set({
      activeSession: {
        ...session,
        attempts: updatedAttempts,
      },
      historyAttempts: {
        ...state.historyAttempts,
        [session.game_key]: gameHistory,
      },
    });
  },

  finishGameSession: (score) => {
    const state = get();
    const session = state.activeSession;
    if (!session) return;

    const completedSession: GameSession = {
      ...session,
      score,
      completed: true,
      ended_at: new Date().toISOString(),
    };

    set({
      activeSession: null,
      allSessions: [completedSession, ...state.allSessions],
    });
  },

  getDifficultyForGame: (userId, gameKey) => {
    const attempts = get().historyAttempts[gameKey] || [];
    return getNextDifficulty(userId, gameKey, attempts);
  },
}));
