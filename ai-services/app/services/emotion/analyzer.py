# ============================================================================
# Emotion Analyzer — Detects emotional state from text
# ============================================================================
from app.models.schemas import EmotionResponse


# Emotion keywords for rule-based fallback analysis
EMOTION_KEYWORDS = {
    "happy": [
        "happy", "glad", "wonderful", "great", "good", "excellent", "joy",
        "love", "beautiful", "blessed", "thankful", "grateful", "smile",
        "laugh", "fun", "enjoy", "lovely", "perfect", "amazing"
    ],
    "sad": [
        "sad", "unhappy", "miss", "lonely", "alone", "crying", "tears",
        "sorry", "lost", "gone", "passed away", "died", "grief", "mourn",
        "heartbroken", "depressed", "down", "blue"
    ],
    "confused": [
        "confused", "don't understand", "what do you mean", "forgot",
        "can't remember", "lost", "where", "when", "who", "how",
        "mixed up", "unclear", "bewildered", "puzzled"
    ],
    "distressed": [
        "scared", "frightened", "afraid", "worry", "worried", "anxious",
        "panic", "help", "pain", "hurt", "emergency", "danger",
        "can't breathe", "falling", "fell", "dying"
    ],
    "calm": [
        "fine", "okay", "alright", "peaceful", "relaxed", "content",
        "comfortable", "resting", "quiet", "easy", "steady"
    ]
}


def analyze_emotion(text: str, audio_features: dict = None) -> EmotionResponse:
    """
    Analyze the emotional state from text input.
    Uses keyword matching as a fast fallback; in production, 
    this would call a fine-tuned sentiment model.
    """
    text_lower = text.lower()
    scores = {}

    for emotion, keywords in EMOTION_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in text_lower)
        # Normalize by keyword count
        scores[emotion] = score / max(len(keywords), 1)

    # Find dominant emotion
    if max(scores.values()) == 0:
        dominant = "calm"
        confidence = 0.5
    else:
        dominant = max(scores, key=scores.get)
        total = sum(scores.values())
        confidence = scores[dominant] / total if total > 0 else 0.5

    return EmotionResponse(
        emotion=dominant,
        confidence=round(min(confidence, 1.0), 3),
        scores={k: round(v, 3) for k, v in scores.items()}
    )
