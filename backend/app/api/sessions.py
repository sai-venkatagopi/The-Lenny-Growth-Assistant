from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.db.repositories import MessageRepository, SessionRepository
from app.schemas.chat import ErrorResponse
from app.schemas.sessions import MessageOut, SessionCreateRequest, SessionOut, SessionSummary

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


@router.post("", response_model=SessionOut)
async def create_session(body: SessionCreateRequest, db: AsyncSession = Depends(get_db)):
    repo = SessionRepository(db)
    session = await repo.create(title=body.title)
    return SessionOut(
        id=session.id,
        title=session.title,
        created_at=session.created_at,
        updated_at=session.updated_at,
        messages=[],
    )


@router.get("", response_model=list[SessionSummary])
async def list_sessions(db: AsyncSession = Depends(get_db)):
    repo = SessionRepository(db)
    sessions = await repo.list_recent()
    summaries = []
    for s in sessions:
        msg_repo = MessageRepository(db)
        msgs = await msg_repo.get_history(s.id, limit=1000)
        summaries.append(
            SessionSummary(
                id=s.id,
                title=s.title,
                created_at=s.created_at,
                updated_at=s.updated_at,
                message_count=len(msgs),
            )
        )
    return summaries


@router.get("/{session_id}", response_model=SessionOut)
async def get_session(session_id: UUID, db: AsyncSession = Depends(get_db)):
    repo = SessionRepository(db)
    session = await repo.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail={"error": {"code": "SESSION_NOT_FOUND", "message": "Session not found"}})
    messages = [
        MessageOut(
            id=m.id,
            role=m.role,
            content=m.content,
            model_used=m.model_used,
            sources=m.sources,
            created_at=m.created_at,
        )
        for m in session.messages
    ]
    return SessionOut(
        id=session.id,
        title=session.title,
        created_at=session.created_at,
        updated_at=session.updated_at,
        messages=messages,
    )


@router.delete("/{session_id}")
async def delete_session(session_id: UUID, db: AsyncSession = Depends(get_db)):
    repo = SessionRepository(db)
    deleted = await repo.delete(session_id)
    if not deleted:
        raise HTTPException(status_code=404, detail={"error": {"code": "SESSION_NOT_FOUND", "message": "Session not found"}})
    return {"deleted": True}
