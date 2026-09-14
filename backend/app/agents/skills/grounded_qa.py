from dataclasses import dataclass

from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.tools import ChatIntent
from app.db.repositories import MessageRepository
from app.llm.base import LLMMessage
from app.llm.router import ModelRouter
from app.rag.prompts import GROUNDED_QA_SYSTEM, GROUNDED_QA_USER, INSUFFICIENT_CONTEXT
from app.rag.retrieval import RAGRetriever


@dataclass
class GroundedQAResult:
    answer: str
    sources: list[dict]
    model: str
    used_fallback: bool


class GroundedQASkill:
    def __init__(self, db: AsyncSession, router: ModelRouter):
        self.db = db
        self.router = router
        self.retriever = RAGRetriever(db)

    async def run(self, session_id, question: str, intent: ChatIntent) -> GroundedQAResult:
        chunks = await self.retriever.retrieve(question)
        context = self.retriever.format_context(chunks)
        sources = self.retriever.chunks_to_sources(chunks)

        msg_repo = MessageRepository(self.db)
        history_msgs = await msg_repo.get_history(session_id, limit=10)
        history = "\n".join(f"{m.role}: {m.content[:300]}" for m in history_msgs[-6:])

        if not chunks:
            return GroundedQAResult(
                answer=INSUFFICIENT_CONTEXT,
                sources=[],
                model="none",
                used_fallback=False,
            )

        provider, used_fallback = await self.router.get_provider_with_fallback()
        system = GROUNDED_QA_SYSTEM.format(context=context)
        user = GROUNDED_QA_USER.format(history=history or "None", question=question)

        response = await self.router.complete_with_fallback(
            provider,
            [
                LLMMessage(role="system", content=system),
                LLMMessage(role="user", content=user),
            ],
            temperature=0.2,
        )

        prefix = "**[DEMO/SEEDED FALLBACK]** " if used_fallback else ""
        answer = prefix + response.content if used_fallback and not response.content.startswith("**[") else response.content

        return GroundedQAResult(
            answer=answer,
            sources=sources,
            model=provider.display_name + (" (fallback)" if used_fallback else ""),
            used_fallback=used_fallback,
        )
