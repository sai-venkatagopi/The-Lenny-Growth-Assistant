import hashlib
import math
import struct

import httpx
import structlog

from app.config import get_settings

logger = structlog.get_logger(__name__)
settings = get_settings()


def _hash_embedding(text: str, dim: int | None = None) -> list[float]:
    """Deterministic embedding for demo/tests when Ollama embed unavailable."""
    dimension = dim or settings.embedding_dimension
    vector = [0.0] * dimension
    tokens = text.lower().split()
    for i, token in enumerate(tokens):
        digest = hashlib.sha256(token.encode()).digest()
        for j in range(min(8, dimension)):
            idx = (int.from_bytes(digest[j : j + 1], "big") + i + j) % dimension
            vector[idx] += 1.0 / (1 + i % 7)
    norm = math.sqrt(sum(v * v for v in vector)) or 1.0
    return [v / norm for v in vector]


async def embed_text(text: str) -> list[float]:
    provider = settings.embeddings_provider

    if provider == "hash":
        return _hash_embedding(text)

    if provider == "openai" and settings.openai_api_key:
        try:
            from openai import AsyncOpenAI

            client = AsyncOpenAI(api_key=settings.openai_api_key)
            response = await client.embeddings.create(
                model="text-embedding-3-small",
                input=text[:8000],
                dimensions=settings.embedding_dimension,
            )
            return response.data[0].embedding
        except Exception as exc:
            logger.warning("openai_embed_failed", error=str(exc))

    # Default: Ollama embeddings
    try:
        async with httpx.AsyncClient(timeout=settings.rag_timeout_seconds) as client:
            response = await client.post(
                f"{settings.ollama_base_url.rstrip('/')}/api/embeddings",
                json={"model": settings.ollama_embed_model, "prompt": text[:8000]},
            )
            if response.status_code == 200:
                data = response.json()
                embedding = data.get("embedding")
                if embedding:
                    if len(embedding) != settings.embedding_dimension:
                        return _normalize_dimension(embedding, settings.embedding_dimension)
                    return embedding
    except Exception as exc:
        logger.warning("ollama_embed_failed_using_hash", error=str(exc))

    return _hash_embedding(text)


def _normalize_dimension(vector: list[float], target: int) -> list[float]:
    if len(vector) == target:
        return vector
    if len(vector) > target:
        return vector[:target]
    padded = vector + [0.0] * (target - len(vector))
    norm = math.sqrt(sum(v * v for v in padded)) or 1.0
    return [v / norm for v in padded]
