from dataclasses import dataclass

from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.tools import ChatIntent
from app.db.repositories import MessageRepository
from app.llm.base import LLMMessage
from app.llm.router import ModelRouter
from app.rag.prompts import SHIP30_SYSTEM, SHIP30_USER
from app.rag.retrieval import RAGRetriever


@dataclass
class Ship30Result:
    title: str
    content: str
    word_count: int
    model: str
    sources: list[dict]


class Ship30WriterSkill:
    TARGET_WORDS = 1250

    def __init__(self, db: AsyncSession, router: ModelRouter):
        self.db = db
        self.router = router
        self.retriever = RAGRetriever(db)

    async def run(self, session_id, topic: str, intent: ChatIntent) -> Ship30Result:
        chunks = await self.retriever.retrieve(topic)
        context = self.retriever.format_context(chunks)
        sources = self.retriever.chunks_to_sources(chunks)

        msg_repo = MessageRepository(self.db)
        history = await msg_repo.get_history(session_id, limit=10)
        prior_answer = next((m.content for m in reversed(history) if m.role == "assistant"), "")

        provider, used_fallback = await self.router.get_provider_with_fallback()
        system = SHIP30_SYSTEM.format(context=context, answer=prior_answer[:2000])
        user = SHIP30_USER.format(topic=topic)

        response = await self.router.complete_with_fallback(
            provider,
            [LLMMessage(role="system", content=system), LLMMessage(role="user", content=user)],
            temperature=0.5,
        )

        content = response.content
        if used_fallback and not content.startswith("#"):
            content = f"# The Growth Question Behind the Growth Question\n\n**[DEMO/SEEDED FALLBACK]**\n\n{content}"

        word_count = len(content.split())
        title_line = content.split("\n")[0].replace("#", "").strip() or "Ship 30 Essay"

        return Ship30Result(
            title=title_line,
            content=content,
            word_count=word_count,
            model=provider.display_name,
            sources=sources,
        )
