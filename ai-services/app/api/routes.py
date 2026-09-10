# ============================================================================
# API Routers — All endpoint definitions for the AI microservice
# ============================================================================
from fastapi import APIRouter
from app.models.schemas import (
    STTRequest, STTResponse,
    TTSRequest, TTSResponse,
    ConverseRequest, ConverseResponse,
    EmbedRequest, EmbedResponse,
    SearchRequest, SearchResponse,
    DifficultyRequest, DifficultyResponse,
    EmotionRequest, EmotionResponse,
    LifeStoryRequest, LifeStoryResponse,
    CoPlayQuestRequest, CoPlayQuestResponse,
    MicroInterventionRequest, MicroInterventionResponse,
)
from app.services.voice.service import speech_to_text, text_to_speech
from app.services.conversation.service import converse
from app.services.memory.service import embed_memory, search_memory
from app.services.games.difficulty import calculate_next_difficulty
from app.services.emotion.analyzer import analyze_emotion
from app.services.theatre.theatre import generate_life_story_episode
from app.services.coplay.quest import generate_coplay_quest
from app.services.interventions.micro import generate_micro_intervention


# ─── Voice Router ──────────────────────────────────────────────────────────────
voice_router = APIRouter(tags=["Voice"])

@voice_router.post("/stt", response_model=STTResponse)
async def stt_endpoint(request: STTRequest):
    """Convert speech audio to text transcript."""
    return await speech_to_text(request)

@voice_router.post("/tts", response_model=TTSResponse)
async def tts_endpoint(request: TTSRequest):
    """Convert text to speech audio."""
    return await text_to_speech(request)


# ─── Conversation Router ──────────────────────────────────────────────────────
conversation_router = APIRouter(tags=["Conversation"])

@conversation_router.post("/converse", response_model=ConverseResponse)
async def converse_endpoint(request: ConverseRequest):
    """
    Main conversation endpoint.
    Runs safety check → emotion analysis → memory retrieval → LLM response.
    """
    return await converse(request)


# ─── Memory Router ─────────────────────────────────────────────────────────────
memory_router = APIRouter(prefix="/memory", tags=["Memory"])

@memory_router.post("/embed", response_model=EmbedResponse)
async def embed_endpoint(request: EmbedRequest):
    """Embed a memory text and store for semantic search."""
    return await embed_memory(request)

@memory_router.post("/search", response_model=SearchResponse)
async def search_endpoint(request: SearchRequest):
    """Search user's memories by semantic similarity."""
    return await search_memory(request)


# ─── Difficulty Router ─────────────────────────────────────────────────────────
difficulty_router = APIRouter(prefix="/difficulty", tags=["Games"])

@difficulty_router.post("/next", response_model=DifficultyResponse)
async def next_difficulty_endpoint(request: DifficultyRequest):
    """Calculate next difficulty parameters based on recent performance."""
    return calculate_next_difficulty(request)


# ─── Emotion Router ───────────────────────────────────────────────────────────
emotion_router = APIRouter(tags=["Emotion"])

@emotion_router.post("/emotion/analyze", response_model=EmotionResponse)
async def emotion_endpoint(request: EmotionRequest):
    """Analyze emotional state from text input."""
    return analyze_emotion(request.text, request.audio_features)


# ─── Stretch Features Router (Life Story Theatre, Co-Play, Micro-Doses) ───────
stretch_router = APIRouter(tags=["Stretch & Differentiators"])

@stretch_router.post("/life-story/generate", response_model=LifeStoryResponse)
async def life_story_endpoint(request: LifeStoryRequest):
    """Generate 3-step interactive memory episode from elder's anecdote."""
    return generate_life_story_episode(request)

@stretch_router.post("/coplay/quest", response_model=CoPlayQuestResponse)
async def coplay_quest_endpoint(request: CoPlayQuestRequest):
    """Generate family co-play memory quest with elder leadership."""
    return generate_coplay_quest(request)

@stretch_router.post("/micro-interventions/suggest", response_model=MicroInterventionResponse)
async def micro_intervention_endpoint(request: MicroInterventionRequest):
    """Generate 1-3 minute contextual cognitive micro-dose."""
    return generate_micro_intervention(request)
