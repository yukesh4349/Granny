# ============================================================================
# Pydantic Schemas — Request/Response models for all AI endpoints
# ============================================================================
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


# ─── Speech-to-Text ────────────────────────────────────────────────────────────

class STTRequest(BaseModel):
    """Audio bytes sent as base64 for transcription"""
    audio_base64: str
    language: str = "en"

class STTResponse(BaseModel):
    transcript: str
    language: str
    confidence: float


# ─── Text-to-Speech ────────────────────────────────────────────────────────────

class TTSRequest(BaseModel):
    text: str
    voice_profile: str = "warm_compassionate"
    language: str = "en"
    speed: float = 0.9  # Slightly slower for elderly users

class TTSResponse(BaseModel):
    audio_base64: str
    duration_seconds: float


# ─── Conversation ──────────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str

class ConverseRequest(BaseModel):
    userId: str
    text: str
    sessionHistory: List[ChatMessage] = []

class ConverseResponse(BaseModel):
    reply: str
    emotion: str  # "happy" | "sad" | "confused" | "distressed" | "calm"
    distressFlag: bool = False
    suggestedAction: Optional[str] = None


# ─── Memory ────────────────────────────────────────────────────────────────────

class EmbedRequest(BaseModel):
    memoryId: str
    text: str
    userId: Optional[str] = None
    type: str = "fact"

class EmbedResponse(BaseModel):
    embeddingRef: str
    dimensions: int = 1536

class SearchRequest(BaseModel):
    userId: str
    query: str
    limit: int = 5

class SearchResult(BaseModel):
    memoryId: str
    content: str
    score: float
    type: str

class SearchResponse(BaseModel):
    results: List[SearchResult]


# ─── Difficulty Engine ─────────────────────────────────────────────────────────

class AttemptData(BaseModel):
    correct: bool
    latencyMs: int
    errorType: Optional[str] = None

class DifficultyRequest(BaseModel):
    userId: str
    gameKey: str
    recentAttempts: List[AttemptData] = []

class DifficultyResponse(BaseModel):
    difficulty: int  # 1–5
    itemCount: int
    delaySeconds: int
    distractorCount: int


# ─── Emotion Analysis ─────────────────────────────────────────────────────────

class EmotionRequest(BaseModel):
    text: str
    audio_features: Optional[dict] = None

class EmotionResponse(BaseModel):
    emotion: str  # "happy" | "sad" | "confused" | "distressed" | "calm"
    confidence: float
    scores: dict  # All emotion scores


# ─── Stretch / Differentiators: Life Story Memory Theatre ─────────────────────

class LifeStoryStep(BaseModel):
    stepIndex: int
    narration: str
    question: str
    choices: List[str]
    positiveFeedback: str

class LifeStoryRequest(BaseModel):
    userId: str
    anecdote: str
    cognitiveLvl: int = 3  # 1 (gentle/direct) to 5 (nuanced)
    culturalContext: Optional[str] = "Indian"

class LifeStoryResponse(BaseModel):
    title: str
    era: str
    steps: List[LifeStoryStep]
    encouragement: str


# ─── Stretch: Family Co-Play Quests ───────────────────────────────────────────

class CoPlayQuestRequest(BaseModel):
    familyGroupId: str
    elderId: str
    topic: str

class CoPlayQuestResponse(BaseModel):
    questId: str
    title: str
    theme: str
    elderRole: str  # e.g. "Chief Storyteller" (elder always leads)
    relativeRole: str  # e.g. "Memory Chronicler"
    clues: List[str]
    sharedGoal: str


# ─── Stretch: Just-in-Time Micro-Interventions ────────────────────────────────

class MicroInterventionRequest(BaseModel):
    userId: str
    timeOfDay: str  # "morning" | "post-lunch" | "evening" | "bedtime"
    recentActivity: Optional[str] = None

class MicroInterventionResponse(BaseModel):
    title: str
    durationMinutes: int  # 1-3 mins
    prompt: str
    quickTask: str
    category: str
