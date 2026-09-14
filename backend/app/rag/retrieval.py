from dataclasses import dataclass
import math

import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import get_settings
from app.db.models import Chunk, Document
from app.rag.embeddings import embed_text

logger = structlog.get_logger(__name__)
settings = get_settings()


@dataclass
class RetrievedChunk:
    chunk_id: str
    document_id: str
    title: str
    url: str | None
    speaker: str | None
    snippet: str
    text: str
    relevance: float
    chunk_index: int


def _cosine_similarity(a: list[float], b: list[float]) -> float:
    if not a or not b or len(a) != len(b):
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(y * y for y in b))
    if na == 0 or nb == 0:
        return 0.0
    return dot / (na * nb)


class RAGRetriever:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def retrieve(self, query: str, top_k: int | None = None) -> list[RetrievedChunk]:
        k = top_k or settings.rag_top_k
        query_embedding = await embed_text(query)

        try:
            return await self._retrieve_pgvector(query_embedding, k)
        except Exception as exc:
            logger.warning("pgvector_retrieval_fallback", error=str(exc))
            return await self._retrieve_python(query_embedding, k)

    async def _retrieve_pgvector(self, query_embedding: list[float], k: int) -> list[RetrievedChunk]:
        distance = Chunk.embedding.cosine_distance(query_embedding).label("distance")
        stmt = (
            select(Chunk, Document, distance)
            .join(Document, Chunk.document_id == Document.id)
            .where(Chunk.embedding.isnot(None))
            .order_by(distance)
            .limit(k)
            .options(selectinload(Chunk.document))
        )
        result = await self.db.execute(stmt)
        rows = result.all()
        return self._rows_to_chunks(rows)

    async def _retrieve_python(self, query_embedding: list[float], k: int) -> list[RetrievedChunk]:
        stmt = select(Chunk, Document).join(Document, Chunk.document_id == Document.id)
        result = await self.db.execute(stmt)
        rows = result.all()
        scored = []
        for chunk, doc in rows:
            emb = chunk.embedding
            if emb is None:
                continue
            if isinstance(emb, str):
                continue
            sim = _cosine_similarity(query_embedding, list(emb))
            scored.append((chunk, doc, 1.0 - sim))
        scored.sort(key=lambda x: x[2])
        return self._rows_to_chunks(scored[:k])

    def _rows_to_chunks(self, rows) -> list[RetrievedChunk]:
        retrieved: list[RetrievedChunk] = []
        for row in rows:
            chunk, doc = row[0], row[1]
            dist = float(row[2]) if len(row) > 2 else 0.0
            relevance = max(0.0, 1.0 - dist)
            if relevance < settings.rag_min_relevance:
                continue
            snippet = chunk.text[:280] + ("..." if len(chunk.text) > 280 else "")
            retrieved.append(
                RetrievedChunk(
                    chunk_id=str(chunk.id),
                    document_id=str(doc.id),
                    title=doc.title,
                    url=doc.url,
                    speaker=doc.speaker,
                    snippet=snippet,
                    text=chunk.text,
                    relevance=round(relevance, 3),
                    chunk_index=chunk.chunk_index,
                )
            )
        logger.info("rag_retrieval", chunks_found=len(retrieved))
        return retrieved

    def format_context(self, chunks: list[RetrievedChunk]) -> str:
        if not chunks:
            return "NO RELEVANT TRANSCRIPT CHUNKS FOUND."
        parts = []
        for i, c in enumerate(chunks, 1):
            meta = f"Episode: {c.title}"
            if c.speaker:
                meta += f" | Guest: {c.speaker}"
            parts.append(f"[Chunk {i} — {meta} — relevance {c.relevance:.0%}]\n{c.text}")
        return "\n\n".join(parts)

    def chunks_to_sources(self, chunks: list[RetrievedChunk]) -> list[dict]:
        return [
            {
                "chunk_id": c.chunk_id,
                "title": c.title,
                "url": c.url,
                "speaker": c.speaker,
                "snippet": c.snippet,
                "relevance": c.relevance,
            }
            for c in chunks
        ]
