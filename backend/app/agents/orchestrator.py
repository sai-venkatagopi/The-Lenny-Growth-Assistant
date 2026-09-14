import uuid
from dataclasses import dataclass

import structlog
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.skills.artifact_gen import ArtifactGeneratorSkill, ArtifactResult
from app.agents.skills.grounded_qa import GroundedQASkill, GroundedQAResult
from app.agents.skills.ship30 import Ship30Result, Ship30WriterSkill
from app.agents.tools import ChatIntent, SkillName, detect_intent
from app.db.repositories import ArtifactRepository, MessageRepository, SessionRepository
from app.llm.router import ModelRouter

logger = structlog.get_logger(__name__)


@dataclass
class ChatOrchestratorResult:
    message_id: uuid.UUID
    answer: str
    sources: list[dict]
    model: str
    artifact: dict | None = None


class AgentOrchestrator:
    """
    Internal agent orchestration layer.

    Decision: We use a lightweight skill router instead of Anthropic Claude Agent SDK
    or Pi Coding Agent to avoid heavy SDK dependencies and keep clear tool boundaries
    for a forward-deployed MVP. Each skill has structured inputs/outputs and isolated prompts.
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self.router = ModelRouter()
        self.grounded_qa = GroundedQASkill(db, self.router)
        self.ship30 = Ship30WriterSkill(db, self.router)
        self.artifact_gen = ArtifactGeneratorSkill(db, self.router)

    async def handle_chat(
        self,
        session_id: uuid.UUID,
        message: str,
        action: str | None = None,
    ) -> ChatOrchestratorResult:
        intent = detect_intent(message, action)
        session_repo = SessionRepository(self.db)
        msg_repo = MessageRepository(self.db)

        await msg_repo.add(session_id, "user", message)
        await session_repo.touch(session_id)

        logger.info("agent_route", skill=intent.skill.value, session_id=str(session_id))

        artifact_payload = None
        if intent.skill == SkillName.SHIP30_WRITER:
            result = await self.ship30.run(session_id, message, intent)
            answer = f"I've generated a Ship 30 essay (~{result.word_count} words): **{result.title}**. View it in the Artifact panel."
            sources = result.sources
            model = result.model
            artifact_payload = await self._persist_artifact(
                session_id, "markdown", result.title, result.content, metadata={"word_count": result.word_count}
            )
        elif intent.skill == SkillName.ARTIFACT_GENERATOR:
            result = await self.artifact_gen.run(session_id, message, intent)
            answer = f"Created **{result.title}** ({result.type} artifact). See the Artifact panel."
            sources = []
            model = result.model
            artifact_payload = await self._persist_artifact(
                session_id, result.type, result.title, result.content, css=result.css
            )
        else:
            qa: GroundedQAResult = await self.grounded_qa.run(session_id, message, intent)
            answer = qa.answer
            sources = qa.sources
            model = qa.model

        assistant_msg = await msg_repo.add(
            session_id, "assistant", answer, model_used=model, sources=sources
        )

        if len(await msg_repo.get_history(session_id)) <= 2:
            title = message[:60] + ("..." if len(message) > 60 else "")
            await session_repo.update_title(session_id, title)

        return ChatOrchestratorResult(
            message_id=assistant_msg.id,
            answer=answer,
            sources=sources,
            model=model,
            artifact=artifact_payload,
        )

    async def generate_artifact(
        self,
        session_id: uuid.UUID,
        request: str,
        artifact_type: str = "markdown",
    ) -> dict:
        intent = ChatIntent(
            skill=SkillName.ARTIFACT_GENERATOR,
            artifact_type=artifact_type,  # type: ignore
            topic=request,
        )
        result: ArtifactResult = await self.artifact_gen.run(session_id, request, intent)
        return await self._persist_artifact(
            session_id, result.type, result.title, result.content, css=result.css
        )

    async def generate_ship30(self, session_id: uuid.UUID, topic: str) -> dict:
        intent = ChatIntent(skill=SkillName.SHIP30_WRITER, topic=topic)
        result: Ship30Result = await self.ship30.run(session_id, topic, intent)
        return await self._persist_artifact(
            session_id,
            "markdown",
            result.title,
            result.content,
            metadata={"word_count": result.word_count, "skill": "ship30"},
        )

    async def _persist_artifact(
        self,
        session_id: uuid.UUID,
        artifact_type: str,
        title: str,
        content: str,
        css: str | None = None,
        metadata: dict | None = None,
    ) -> dict:
        repo = ArtifactRepository(self.db)
        artifact = await repo.create(session_id, artifact_type, title, content, css=css, metadata=metadata)
        return {
            "id": str(artifact.id),
            "type": artifact.type,
            "title": artifact.title,
            "content": artifact.content,
            "css": artifact.css,
            "created_at": artifact.created_at.isoformat(),
        }
