from uuid import UUID

import structlog
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.orchestrator import AgentOrchestrator
from app.db.database import get_db
from app.db.repositories import SessionRepository
from app.llm.base import LLMError
from app.schemas.chat import ChatRequest, ChatResponse, SourceCitation

router = APIRouter(prefix="/api/chat", tags=["chat"])
logger = structlog.get_logger(__name__)


@router.post("", response_model=ChatResponse)
async def chat(body: ChatRequest, db: AsyncSession = Depends(get_db)):
    session_repo = SessionRepository(db)
    session = await session_repo.get(body.session_id)
    if not session:
        raise HTTPException(
            status_code=404,
            detail={"error": {"code": "SESSION_NOT_FOUND", "message": "Session not found"}},
        )

    orchestrator = AgentOrchestrator(db)
    try:
        result = await orchestrator.handle_chat(body.session_id, body.message, body.action)
        await db.commit()
    except LLMError as exc:
        logger.error("chat_llm_error", code=exc.code, message=exc.message)
        raise HTTPException(status_code=503, detail={"error": {"code": exc.code, "message": exc.message}})
    except Exception as exc:
        logger.error("chat_error", error=str(exc))
        raise HTTPException(
            status_code=500,
            detail={"error": {"code": "INTERNAL_ERROR", "message": "Failed to process chat request"}},
        )

    sources = [SourceCitation(**s) for s in result.sources]
    return ChatResponse(
        id=result.message_id,
        session_id=body.session_id,
        content=result.answer,
        sources=sources,
        model=result.model,
        artifact=result.artifact,
    )
