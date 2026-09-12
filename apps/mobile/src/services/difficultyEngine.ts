// Granny Adaptive Cognitive Difficulty Engine
// Shared client & edge logic: rolling accuracy % + latency evaluation

import { AttemptLog, GameKey } from '../types';

export interface DifficultyParameters {
  level: number; // 1 to 5
  itemCount: number;
  delaySeconds: number;
  hasDistractors: boolean;
  accuracyRate: number;
  averageLatencyMs: number;
  gentleMode: boolean;
}

export function getNextDifficulty(
  userId: string,
  gameKey: GameKey,
  recentAttempts: AttemptLog[] = [],
  currentLevel = 1
): DifficultyParameters {
  if (!recentAttempts || recentAttempts.length === 0) {
    const defaultLevel = Math.max(1, Math.min(5, currentLevel || 1));
    return {
      level: defaultLevel,
      itemCount: 2 + defaultLevel,
      delaySeconds: Math.max(3, 8 - defaultLevel),
      hasDistractors: defaultLevel >= 3,
      accuracyRate: 1.0,
      averageLatencyMs: 2500,
      gentleMode: false,
    };
  }

  // Evaluate rolling window of last 5-8 attempts
  const sample = recentAttempts.slice(-8);
  const correctCount = sample.filter((a) => a.correct).length;
  const accuracyRate = correctCount / sample.length;
  const averageLatencyMs =
    sample.reduce((sum, a) => sum + (a.latency_ms || 2500), 0) / sample.length;

  let nextLevel = currentLevel || 1;
  let gentleMode = false;

  if (sample.length >= 3) {
    if (accuracyRate >= 0.8 && averageLatencyMs < 4500) {
      // High accuracy and brisk response: advance level
      nextLevel = Math.min(5, nextLevel + 1);
    } else if (accuracyRate < 0.5 || averageLatencyMs > 8500) {
      // Struggling or long latency: provide gentler experience
      nextLevel = Math.max(1, nextLevel - 1);
      gentleMode = true;
    }
  }

  const clampedLevel = Math.max(1, Math.min(5, nextLevel));
  const itemCount = Math.min(8, 2 + clampedLevel);
  const delaySeconds = Math.max(2, 9 - clampedLevel);
  const hasDistractors = clampedLevel >= 3;

  return {
    level: clampedLevel,
    itemCount,
    delaySeconds,
    hasDistractors,
    accuracyRate: Math.round(accuracyRate * 100) / 100,
    averageLatencyMs: Math.round(averageLatencyMs),
    gentleMode,
  };
}
