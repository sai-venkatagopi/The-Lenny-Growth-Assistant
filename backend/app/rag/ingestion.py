"""Transcript ingestion pipeline — idempotent chunk + embed + store."""

import argparse
import asyncio
from pathlib import Path

import structlog
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.db.database import AsyncSessionLocal
from app.db.repositories import ChunkRepository, DocumentRepository
from app.rag.chunking import chunk_text, parse_transcript_metadata
from app.rag.embeddings import embed_text

logger = structlog.get_logger(__name__)
settings = get_settings()


async def ingest_file(db: AsyncSession, file_path: Path) -> int:
    content = file_path.read_text(encoding="utf-8")
    meta = parse_transcript_metadata(file_path.name, content)
    source_key = file_path.name

    doc_repo = DocumentRepository(db)
    chunk_repo = ChunkRepository(db)

    doc = await doc_repo.upsert_document(
        source_key=source_key,
        title=meta["title"],
        raw_text=content,
        url=meta.get("url"),
        speaker=meta.get("speaker"),
        metadata={"filename": file_path.name, "fixture": "sample" in file_path.name.lower()},
    )

    await chunk_repo.delete_for_document(doc.id)
    chunks = chunk_text(content)
    inserted = 0

    for chunk in chunks:
        if await chunk_repo.chunk_exists(chunk.content_hash):
            continue
        embedding = await embed_text(chunk.text)
        await chunk_repo.add_chunk(
            document_id=doc.id,
            chunk_index=chunk.index,
            text=chunk.text,
            embedding=embedding,
            content_hash=chunk.content_hash,
            metadata={"source_key": source_key, "title": meta["title"]},
        )
        inserted += 1

    logger.info("ingested_file", file=file_path.name, chunks=inserted)
    return inserted


async def ingest_directory(transcripts_dir: Path) -> dict:
    transcripts_dir = transcripts_dir.resolve()
    if not transcripts_dir.exists():
        logger.warning("transcripts_dir_missing", path=str(transcripts_dir))
        return {"files": 0, "chunks": 0}

    files = list(transcripts_dir.glob("**/*.md")) + list(transcripts_dir.glob("**/*.txt"))
    total_chunks = 0

    async with AsyncSessionLocal() as db:
        for file_path in files:
            if file_path.name.startswith("."):
                continue
            try:
                total_chunks += await ingest_file(db, file_path)
            except Exception as exc:
                logger.error("ingest_file_failed", file=str(file_path), error=str(exc))
        await db.commit()

    return {"files": len(files), "chunks": total_chunks}


async def main_async(transcripts_dir: str) -> None:
    result = await ingest_directory(Path(transcripts_dir))
    print(f"Ingestion complete: {result['files']} files, {result['chunks']} chunks indexed")


def main() -> None:
    parser = argparse.ArgumentParser(description="Ingest Lenny podcast transcripts")
    parser.add_argument("--transcripts-dir", default="../data/transcripts")
    args = parser.parse_args()
    asyncio.run(main_async(args.transcripts_dir))


if __name__ == "__main__":
    main()
