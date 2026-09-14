import uuid
from datetime import datetime

from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models import Artifact, Chunk, Document, Message, Session, User


class SessionRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, title: str = "New conversation", user_id: uuid.UUID | None = None) -> Session:
        session = Session(title=title, user_id=user_id)
        self.db.add(session)
        await self.db.flush()
        await self.db.refresh(session)
        return session

    async def get(self, session_id: uuid.UUID) -> Session | None:
        result = await self.db.execute(
            select(Session)
            .where(Session.id == session_id)
            .options(selectinload(Session.messages), selectinload(Session.artifacts))
        )
        return result.scalar_one_or_none()

    async def list_recent(self, limit: int = 50) -> list[Session]:
        result = await self.db.execute(select(Session).order_by(Session.updated_at.desc()).limit(limit))
        return list(result.scalars().all())

    async def delete(self, session_id: uuid.UUID) -> bool:
        result = await self.db.execute(delete(Session).where(Session.id == session_id))
        return result.rowcount > 0

    async def touch(self, session_id: uuid.UUID) -> None:
        await self.db.execute(
            update(Session).where(Session.id == session_id).values(updated_at=datetime.utcnow())
        )

    async def update_title(self, session_id: uuid.UUID, title: str) -> None:
        await self.db.execute(update(Session).where(Session.id == session_id).values(title=title))


class MessageRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def add(
        self,
        session_id: uuid.UUID,
        role: str,
        content: str,
        model_used: str | None = None,
        sources: list | None = None,
    ) -> Message:
        message = Message(
            session_id=session_id,
            role=role,
            content=content,
            model_used=model_used,
            sources=sources,
        )
        self.db.add(message)
        await self.db.flush()
        await self.db.refresh(message)
        return message

    async def get_history(self, session_id: uuid.UUID, limit: int = 20) -> list[Message]:
        result = await self.db.execute(
            select(Message)
            .where(Message.session_id == session_id)
            .order_by(Message.created_at.asc())
            .limit(limit)
        )
        return list(result.scalars().all())


class ArtifactRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(
        self,
        session_id: uuid.UUID,
        artifact_type: str,
        title: str,
        content: str,
        css: str | None = None,
        metadata: dict | None = None,
    ) -> Artifact:
        artifact = Artifact(
            session_id=session_id,
            type=artifact_type,
            title=title,
            content=content,
            css=css,
            metadata_json=metadata,
        )
        self.db.add(artifact)
        await self.db.flush()
        await self.db.refresh(artifact)
        return artifact

    async def get(self, artifact_id: uuid.UUID) -> Artifact | None:
        result = await self.db.execute(select(Artifact).where(Artifact.id == artifact_id))
        return result.scalar_one_or_none()

    async def list_for_session(self, session_id: uuid.UUID) -> list[Artifact]:
        result = await self.db.execute(
            select(Artifact).where(Artifact.session_id == session_id).order_by(Artifact.created_at.desc())
        )
        return list(result.scalars().all())


class DocumentRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def upsert_document(
        self,
        source_key: str,
        title: str,
        raw_text: str,
        url: str | None = None,
        speaker: str | None = None,
        metadata: dict | None = None,
    ) -> Document:
        result = await self.db.execute(select(Document).where(Document.source_key == source_key))
        doc = result.scalar_one_or_none()
        if doc:
            doc.title = title
            doc.raw_text = raw_text
            doc.url = url
            doc.speaker = speaker
            doc.metadata_json = metadata
        else:
            doc = Document(
                source_key=source_key,
                title=title,
                raw_text=raw_text,
                url=url,
                speaker=speaker,
                metadata_json=metadata,
            )
            self.db.add(doc)
        await self.db.flush()
        await self.db.refresh(doc)
        return doc

    async def get_by_source_key(self, source_key: str) -> Document | None:
        result = await self.db.execute(select(Document).where(Document.source_key == source_key))
        return result.scalar_one_or_none()


class ChunkRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def chunk_exists(self, content_hash: str) -> bool:
        result = await self.db.execute(select(Chunk.id).where(Chunk.content_hash == content_hash).limit(1))
        return result.scalar_one_or_none() is not None

    async def add_chunk(
        self,
        document_id: uuid.UUID,
        chunk_index: int,
        text: str,
        embedding: list[float],
        content_hash: str,
        metadata: dict | None = None,
    ) -> Chunk:
        chunk = Chunk(
            document_id=document_id,
            chunk_index=chunk_index,
            text=text,
            embedding=embedding,
            content_hash=content_hash,
            metadata_json=metadata,
        )
        self.db.add(chunk)
        await self.db.flush()
        return chunk

    async def delete_for_document(self, document_id: uuid.UUID) -> None:
        await self.db.execute(delete(Chunk).where(Chunk.document_id == document_id))

    async def count(self) -> int:
        result = await self.db.execute(select(Chunk.id))
        return len(result.scalars().all())


class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_or_create_default(self) -> User:
        result = await self.db.execute(select(User).limit(1))
        user = result.scalar_one_or_none()
        if user:
            return user
        user = User(display_name="Demo User")
        self.db.add(user)
        await self.db.flush()
        await self.db.refresh(user)
        return user
