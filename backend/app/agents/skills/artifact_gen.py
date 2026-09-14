import json
import re
from dataclasses import dataclass

from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.tools import ChatIntent
from app.db.repositories import MessageRepository
from app.llm.base import LLMMessage
from app.llm.router import ModelRouter
from app.rag.prompts import ARTIFACT_HTML_SYSTEM, ARTIFACT_MARKDOWN_SYSTEM
from app.rag.retrieval import RAGRetriever
from app.security.artifact_sanitizer import sanitize_html


@dataclass
class ArtifactResult:
    type: str
    title: str
    content: str
    css: str | None
    model: str


class ArtifactGeneratorSkill:
    def __init__(self, db: AsyncSession, router: ModelRouter):
        self.db = db
        self.router = router
        self.retriever = RAGRetriever(db)

    async def run(self, session_id, request: str, intent: ChatIntent) -> ArtifactResult:
        artifact_type = intent.artifact_type or "markdown"
        chunks = await self.retriever.retrieve(request)
        context = self.retriever.format_context(chunks)

        msg_repo = MessageRepository(self.db)
        history_msgs = await msg_repo.get_history(session_id, limit=8)
        history = "\n".join(f"{m.role}: {m.content[:400]}" for m in history_msgs)

        provider, _ = await self.router.get_provider_with_fallback()

        if artifact_type == "html":
            return await self._generate_html(provider, context, request, history)
        return await self._generate_markdown(provider, context, request, history)

    async def _generate_markdown(self, provider, context: str, request: str, history: str) -> ArtifactResult:
        system = ARTIFACT_MARKDOWN_SYSTEM.format(context=context, history=history)
        response = await self.router.complete_with_fallback(
            provider,
            [
                LLMMessage(role="system", content=system),
                LLMMessage(role="user", content=f"Create a markdown artifact: {request}"),
            ],
            temperature=0.4,
        )
        content = response.content
        title_match = re.search(r"^#\s+(.+)$", content, re.MULTILINE)
        title = title_match.group(1) if title_match else "Strategy Document"
        return ArtifactResult(
            type="markdown",
            title=title,
            content=content,
            css=None,
            model=provider.display_name,
        )

    async def _generate_html(self, provider, context: str, request: str, history: str) -> ArtifactResult:
        system = ARTIFACT_HTML_SYSTEM.format(context=context, request=request)
        response = await self.router.complete_with_fallback(
            provider,
            [LLMMessage(role="system", content=system), LLMMessage(role="user", content=request)],
            temperature=0.4,
        )
        raw = response.content.strip()
        try:
            if raw.startswith("```"):
                raw = re.sub(r"^```(?:json)?\n?", "", raw)
                raw = re.sub(r"\n?```$", "", raw)
            data = json.loads(raw)
            html = sanitize_html(data.get("html", ""))
            css = data.get("css", "")
            title = data.get("title", "HTML Artifact")
            return ArtifactResult(type="html", title=title, content=html, css=css, model=provider.display_name)
        except (json.JSONDecodeError, TypeError):
            html = sanitize_html(raw)
            return ArtifactResult(
                type="html",
                title="Product Concept",
                content=html,
                css="body{font-family:system-ui;padding:2rem;max-width:720px;margin:0 auto;}",
                model=provider.display_name,
            )
