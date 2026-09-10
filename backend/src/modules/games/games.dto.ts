// ============================================================================
// Games DTOs
// ============================================================================
export class StartSessionDto {
  gameKey: string;
  difficulty?: number;
}

export class SubmitAttemptDto {
  sessionId: string;
  itemIndex: number;
  correct: boolean;
  latencyMs: number;
  errorType?: string;
}

export class EndSessionDto {
  sessionId: string;
  score?: number;
}

export class GetNextDifficultyDto {
  gameKey: string;
}
