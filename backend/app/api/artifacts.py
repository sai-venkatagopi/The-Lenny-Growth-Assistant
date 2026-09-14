from uuid import UUID

import structlog
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.orchestrator import AgentOrchestrator
from app.db.database import get_db
from app.db.repositories import ArtifactRepository, SessionRepository
from app.llm.base import LLMError
from app.schemas.artifacts import ArtifactCreateRequest, ArtifactOut

router = APIRouter(prefix="/api/artifacts", tags=["artifacts"])
logger = structlog.get_logger(__name__)


@router.post("", response_model=ArtifactOut)
async def create_artifact(body: ArtifactCreateRequest, db: AsyncSession = Depends(get_db)):
    session_repo = SessionRepository(db)
    session = await session_repo.get(body.session_id)
    if not session:
        raise HTTPException(status_code=404, detail={"error": {"code": "SESSION_NOT_FOUND", "message": "Session not found"}})

    orchestrator = AgentOrchestrator(db)
    try:
        if body.skill == "ship30":
            payload = await orchestrator.generate_ship30(body.session_id, body.request)
        else:
            payload = await orchestrator.generate_artifact(body.session_id, body.request, body.type)
        await db.commit()
    except LLMError as exc:
        raise HTTPException(status_code=503, detail={"error": {"code": exc.code, "message": exc.message}})

    repo = ArtifactRepository(db)
    artifact = await repo.get(UUID(payload["id"]))
    if not artifact:
        raise HTTPException(status_code=500, detail={"error": {"code": "ARTIFACT_ERROR", "message": "Failed to persist artifact"}})

    return ArtifactOut(
        id=artifact.id,
        session_id=artifact.session_id,
        type=artifact.type,
        title=artifact.title,
        content=artifact.content,
        css=artifact.css,
        created_at=artifact.created_at,
    )


@router.get("/{artifact_id}", response_model=ArtifactOut)
async def get_artifact(artifact_id: UUID, db: AsyncSession = Depends(get_db)):
    repo = ArtifactRepository(db)
    artifact = await repo.get(artifact_id)
    if not artifact:
        raise HTTPException(status_code=404, detail={"error": {"code": "ARTIFACT_NOT_FOUND", "message": "Artifact not found"}})
    return ArtifactOut(
        id=artifact.id,
        session_id=artifact.session_id,
        type=artifact.type,
        title=artifact.title,
        content=artifact.content,
        css=artifact.css,
        created_at=artifact.created_at,
    )
