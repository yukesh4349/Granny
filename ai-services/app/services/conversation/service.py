# ============================================================================
# Conversation Service — Orchestrates memory retrieval, emotion, LLM, & safety
# Integrated with Google Gemini API
# ============================================================================
import os
import json
import urllib.request
import urllib.error
from typing import List, Optional
from app.models.schemas import ConverseRequest, ConverseResponse, ChatMessage
from app.prompts.persona import (
    GRANNY_PERSONA, MEMORY_CONTEXT_TEMPLATE, EMOTION_CONTEXT_TEMPLATE
)
from app.prompts.safety_rules import check_distress, get_de_escalation_response, SAFETY_RULES
from app.services.emotion.analyzer import analyze_emotion


# In-memory store for simple memory retrieval (production: vector DB)
memory_store: dict[str, list[dict]] = {}


def add_to_memory_store(user_id: str, memory: dict):
    """Add a memory record to the in-memory store."""
    if user_id not in memory_store:
        memory_store[user_id] = []
    memory_store[user_id].append(memory)


def search_memories(user_id: str, query: str, limit: int = 5) -> list[dict]:
    """Simple keyword-based memory search (production: vector similarity)."""
    if user_id not in memory_store:
        return []
    
    query_lower = query.lower()
    scored = []
    for mem in memory_store[user_id]:
        content = mem.get("content", "").lower()
        score = sum(1 for word in query_lower.split() if word in content)
        if score > 0:
            scored.append((score, mem))
    
    scored.sort(key=lambda x: x[0], reverse=True)
    return [m for _, m in scored[:limit]]


async def converse(request: ConverseRequest) -> ConverseResponse:
    """
    Main conversation pipeline:
    1. Check for distress (safety first)
    2. Analyze emotion
    3. Retrieve relevant memories
    4. Build system prompt
    5. Call Gemini LLM (or use mock response)
    6. Return response with metadata
    """
    
    # Step 1: Safety check — runs BEFORE everything else
    is_distressed, matched_phrase = check_distress(request.text)
    if is_distressed:
        return ConverseResponse(
            reply=get_de_escalation_response(),
            emotion="distressed",
            distressFlag=True,
            suggestedAction="contact_emergency"
        )
    
    # Step 2: Emotion analysis
    emotion_result = analyze_emotion(request.text)
    
    # Step 3: Memory retrieval
    memories = search_memories(request.userId, request.text)
    memory_text = ""
    if memories:
        memory_lines = [f"- {m.get('content', '')}" for m in memories]
        memory_text = MEMORY_CONTEXT_TEMPLATE.format(memories="\n".join(memory_lines))
    
    # Step 4: Build system prompt
    emotion_context = EMOTION_CONTEXT_TEMPLATE.format(
        emotion=emotion_result.emotion,
        confidence=emotion_result.confidence
    )
    
    system_prompt = GRANNY_PERSONA.format(
        memory_context=memory_text,
        emotion_context=emotion_context
    ) + "\n" + SAFETY_RULES
    
    # Step 5: Generate response (Google Gemini API with contextual fallback)
    reply = await _generate_response(system_prompt, request.text, request.sessionHistory)
    
    return ConverseResponse(
        reply=reply,
        emotion=emotion_result.emotion,
        distressFlag=False,
        suggestedAction=None
    )


async def _generate_response(
    system_prompt: str,
    user_text: str,
    history: List[ChatMessage]
) -> str:
    """
    Generate a response using Google Gemini API with primary and backup key rotation.
    Falls back to intelligent elderly-companion mock if all calls fail.
    """
    primary_key = os.getenv("GEMINI_API_KEY", "").strip()
    backup_key = os.getenv("GEMINI_API_KEY_BACKUP", "").strip()
    gemini_model = os.getenv("GEMINI_MODEL", "gemini-1.5-flash").strip()

    keys_to_try = [k for k in [primary_key, backup_key] if k]

    # 1. Try Google Gemini API with key fallback
    for api_key in keys_to_try:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{gemini_model}:generateContent?key={api_key}"
            
            contents = []
            for msg in history[-8:]:
                contents.append({
                    "role": "user" if msg.role == "user" else "model",
                    "parts": [{"text": msg.content}]
                })
            contents.append({
                "role": "user",
                "parts": [{"text": user_text}]
            })

            payload = {
                "system_instruction": {
                    "parts": [{"text": system_prompt}]
                },
                "contents": contents,
                "generationConfig": {
                    "temperature": 0.7,
                    "maxOutputTokens": 250
                }
            }

            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode('utf-8'),
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                text_reply = data["candidates"][0]["content"]["parts"][0]["text"]
                if text_reply:
                    return text_reply.strip()
        except Exception as e:
            print(f"[LLM] Gemini API key attempt failed: {e}. Trying next key if available.")

    # 2. Contextual Elderly Companion Mock Fallback
    return _mock_response(user_text)


def _mock_response(text: str) -> str:
    """Generate contextually appropriate mock responses for demo/development."""
    text_lower = text.lower()
    
    if any(w in text_lower for w in ["hello", "hi", "hey", "good morning", "good evening", "vanakkam"]):
        return "Hello, dear! It's so lovely to hear from you. How are you feeling today?"
    
    if any(w in text_lower for w in ["how are you", "how do you do"]):
        return "I'm doing well, thank you for asking! But more importantly, how are YOU doing today? Did you sleep well?"
    
    if any(w in text_lower for w in ["medicine", "medication", "pill", "tablet"]):
        return "Let me check your schedule. Remember, it's important to take your medicines on time. Would you like me to remind you when it's time?"
    
    if any(w in text_lower for w in ["game", "play", "fun"]):
        return "Oh, that sounds wonderful! We have 10 memory games to play together. Would you like to try 'Remember My Home' or 'Memory Market'?"
    
    if any(w in text_lower for w in ["family", "son", "daughter", "grandchild", "rahul", "priya"]):
        return "Family is so precious, isn't it? Would you like to tell me more about them? I love hearing your stories."
    
    if any(w in text_lower for w in ["remember", "memory", "forgot", "forget"]):
        return "Don't worry, dear. Our memories are precious. Would you like me to help you remember something, or shall we visit the Memory Album?"
    
    if any(w in text_lower for w in ["tired", "sleep", "rest"]):
        return "Rest is very important, dear. Would you like me to set a gentle reminder for your nap time? Taking care of yourself is the best thing you can do."
    
    if any(w in text_lower for w in ["food", "eat", "hungry", "cook", "recipe", "tea"]):
        return "Good nutrition and hydration are so important! Would you like me to share a recipe, or help you remember what you had for breakfast today?"
    
    if any(w in text_lower for w in ["thank", "thanks"]):
        return "You're very welcome, dear. I'm always right here with you whenever you need me."
    
    if any(w in text_lower for w in ["bye", "goodbye", "see you"]):
        return "Take care, dear! Remember, I'm always here whenever you want to chat. Have a wonderful rest of your day!"
    
    return "That's wonderful to hear, dear. Tell me more about that — I'm listening with care."
