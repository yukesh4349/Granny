# ============================================================================
# FastAPI Main — AI Microservice for Granny
# ============================================================================
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import (
    voice_router,
    conversation_router,
    memory_router,
    difficulty_router,
    emotion_router,
    stretch_router,
)

app = FastAPI(
    title="Granny AI Companion Services",
    version="1.0.0",
    description=(
        "FastAPI microservice powering voice interaction, empathetic conversation, "
        "semantic memory, adaptive game difficulty, life-story theatre, and safety guardrails for the "
        "Granny elderly companion platform."
    ),
)

# CORS — allow frontend and backend origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routers
app.include_router(voice_router)
app.include_router(conversation_router)
app.include_router(memory_router)
app.include_router(difficulty_router)
app.include_router(emotion_router)
app.include_router(stretch_router)


@app.get("/health")
def health_check():
    """Health check for Docker Compose readiness probes."""
    return {
        "status": "ok",
        "service": "granny-ai-services",
        "endpoints": [
            "POST /stt",
            "POST /tts",
            "POST /converse",
            "POST /memory/embed",
            "POST /memory/search",
            "POST /difficulty/next",
            "POST /emotion/analyze",
            "POST /life-story/generate",
            "POST /coplay/quest",
            "POST /micro-interventions/suggest",
        ]
    }
