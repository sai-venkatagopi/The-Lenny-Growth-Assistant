import os

import pytest

from app.rag.chunking import chunk_text, parse_transcript_metadata
from app.rag.embeddings import embed_text


def test_chunk_text():
    text = "First sentence. Second sentence. Third sentence. " * 20
    chunks = chunk_text(text, chunk_size=200, overlap=50)
    assert len(chunks) >= 2
    assert all(c.content_hash for c in chunks)


def test_parse_metadata():
    content = "Title: Test Episode\nSource URL: https://example.com\nGuest: Jane Doe\n\nBody"
    meta = parse_transcript_metadata("file.md", content)
    assert meta["title"] == "Test Episode"
    assert meta["url"] == "https://example.com"
    assert meta["speaker"] == "Jane Doe"


@pytest.mark.asyncio
async def test_hash_embedding():
    os.environ["EMBEDDINGS_PROVIDER"] = "hash"
    v1 = await embed_text("activation loop retention")
    v2 = await embed_text("activation loop retention")
    v3 = await embed_text("completely different topic")
    assert len(v1) == 768
    assert v1 == v2
    assert v1 != v3
