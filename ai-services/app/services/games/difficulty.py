# ============================================================================
# Adaptive Difficulty Engine — Central scoring + next-difficulty algorithm
# ============================================================================
from app.models.schemas import DifficultyRequest, DifficultyResponse

# Difficulty level configurations
DIFFICULTY_LEVELS = {
    1: {"itemCount": 2, "delaySeconds": 3, "distractorCount": 0},
    2: {"itemCount": 3, "delaySeconds": 5, "distractorCount": 1},
    3: {"itemCount": 4, "delaySeconds": 7, "distractorCount": 2},
    4: {"itemCount": 5, "delaySeconds": 10, "distractorCount": 3},
    5: {"itemCount": 6, "delaySeconds": 15, "distractorCount": 4},
}

# Exponential moving average weights
EMA_ALPHA = 0.3  # Weight for recent attempts


def calculate_next_difficulty(request: DifficultyRequest) -> DifficultyResponse:
    """
    Calculate next difficulty using Exponential Moving Average of 
    accuracy + latency, clamped to 5 levels.
    
    Algorithm:
    1. Compute accuracy EMA from recent attempts
    2. Compute latency score (faster = higher score)
    3. Blend accuracy (70%) + speed (30%) into a composite score
    4. Map composite score to difficulty level 1–5
    """
    if not request.recentAttempts:
        # No history — start at level 3 (medium)
        level = 3
        config = DIFFICULTY_LEVELS[level]
        return DifficultyResponse(
            difficulty=level,
            **config
        )
    
    # Calculate accuracy EMA
    accuracy_ema = 0.5  # Start neutral
    for attempt in request.recentAttempts:
        value = 1.0 if attempt.correct else 0.0
        accuracy_ema = EMA_ALPHA * value + (1 - EMA_ALPHA) * accuracy_ema
    
    # Calculate latency score (normalize to 0–1 range)
    # Assume ideal latency is 2000ms, max is 15000ms
    latencies = [a.latencyMs for a in request.recentAttempts if a.latencyMs > 0]
    if latencies:
        avg_latency = sum(latencies) / len(latencies)
        # Faster = higher score, clamped between 0 and 1
        latency_score = max(0, min(1, 1 - (avg_latency - 2000) / 13000))
    else:
        latency_score = 0.5
    
    # Composite score: 70% accuracy + 30% speed
    composite = 0.7 * accuracy_ema + 0.3 * latency_score
    
    # Map to difficulty level (1–5)
    if composite < 0.2:
        level = 1
    elif composite < 0.4:
        level = 2
    elif composite < 0.6:
        level = 3
    elif composite < 0.8:
        level = 4
    else:
        level = 5
    
    config = DIFFICULTY_LEVELS[level]
    return DifficultyResponse(
        difficulty=level,
        **config
    )
