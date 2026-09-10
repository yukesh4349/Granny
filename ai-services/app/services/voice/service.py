# ============================================================================
# Voice Services — STT and TTS stubs
# ============================================================================
import base64
from app.models.schemas import STTRequest, STTResponse, TTSRequest, TTSResponse


async def speech_to_text(request: STTRequest) -> STTResponse:
    """
    Convert audio to text transcript.
    Production: Whisper API or local Whisper model.
    Currently returns a mock/placeholder response.
    """
    # In production: decode audio, run through Whisper, return transcript
    # audio_bytes = base64.b64decode(request.audio_base64)
    
    return STTResponse(
        transcript="[Voice input received — Whisper STT not configured]",
        language=request.language,
        confidence=0.0
    )


async def text_to_speech(request: TTSRequest) -> TTSResponse:
    """
    Convert text to speech audio.
    Production: ElevenLabs, Google TTS, or local TTS engine.
    Currently returns a mock/placeholder response.
    """
    # In production: call TTS API, return audio bytes
    # For now, return empty audio placeholder
    
    return TTSResponse(
        audio_base64=base64.b64encode(b"").decode(),
        duration_seconds=len(request.text.split()) * 0.5  # Rough estimate
    )
