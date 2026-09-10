# ============================================================================
# Memory Service — Embedding storage and semantic search
# ============================================================================
import uuid
from typing import List, Optional
from app.models.schemas import (
    EmbedRequest, EmbedResponse, SearchRequest, SearchResult, SearchResponse
)
from app.services.conversation.service import add_to_memory_store, search_memories


# In-memory embedding store (production: pgvector or Pinecone)
_embeddings: dict[str, dict] = {}


async def embed_memory(request: EmbedRequest) -> EmbedResponse:
    """
    Embed a memory text and store it.
    In production, this generates actual vector embeddings.
    For now, stores with a reference ID for text-based search.
    """
    ref_id = f"emb_{uuid.uuid4().hex[:12]}"
    
    _embeddings[ref_id] = {
        "memoryId": request.memoryId,
        "text": request.text,
        "userId": request.userId,
        "type": request.type,
    }
    
    # Also add to the conversation service's memory store
    if request.userId:
        add_to_memory_store(request.userId, {
            "id": request.memoryId,
            "content": request.text,
            "type": request.type,
        })
    
    return EmbedResponse(embeddingRef=ref_id, dimensions=1536)


async def search_memory(request: SearchRequest) -> SearchResponse:
    """
    Search memories by semantic similarity.
    Uses text-based matching as fallback when no vector DB is configured.
    """
    results = search_memories(request.userId, request.query, request.limit)
    
    search_results = [
        SearchResult(
            memoryId=r.get("id", "unknown"),
            content=r.get("content", ""),
            score=0.8,  # Mock similarity score
            type=r.get("type", "fact"),
        )
        for r in results
    ]
    
    return SearchResponse(results=search_results)
