import asyncio
import os
import uuid
from collections.abc import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import JSON, event
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

os.environ.setdefault("MODEL_PROVIDER", "demo")
os.environ.setdefault("EMBEDDINGS_PROVIDER", "hash")
os.environ.setdefault("DEMO_FALLBACK_ENABLED", "true")

TEST_DB = os.environ.get("TEST_DATABASE_URL", "sqlite+aiosqlite:///:memory:")

from sqlalchemy.dialects.postgresql import JSONB

from app.db.models import Base, Chunk, Message, Document, Artifact
from app.main import app


def _patch_sqlite_compat():
    if "sqlite" not in TEST_DB:
        return
    Chunk.__table__.c.embedding.type = JSON()
    Chunk.__table__.c.metadata_json.type = JSON()
    Message.__table__.c.sources.type = JSON()
    Document.__table__.c.metadata_json.type = JSON()
    Artifact.__table__.c.metadata_json.type = JSON()


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    _patch_sqlite_compat()
    engine = create_async_engine(TEST_DB)
    async with engine.begin() as conn:
        if "postgresql" in TEST_DB:
            await conn.execute(__import__("sqlalchemy").text("CREATE EXTENSION IF NOT EXISTS vector"))
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with session_factory() as session:
        yield session

    await engine.dispose()


@pytest_asyncio.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    from app.db import database

    async def override_get_db():
        try:
            yield db_session
            await db_session.commit()
        except Exception:
            await db_session.rollback()
            raise

    app.dependency_overrides[database.get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()
