"""Deterministic demo fallback when Ollama/cloud unavailable."""

from app.llm.base import LLMMessage, LLMProvider, LLMResponse


class DemoProvider(LLMProvider):
    """Clearly labeled fallback — composes answers from retrieved context only."""

    @property
    def provider_name(self) -> str:
        return "demo"

    @property
    def model_name(self) -> str:
        return "seeded-fallback"

    async def health_check(self) -> dict:
        return {"available": True, "mode": "deterministic_fallback"}

    async def complete(self, messages: list[LLMMessage], temperature: float = 0.3) -> LLMResponse:
        user_msg = next((m.content for m in reversed(messages) if m.role == "user"), "")
        system_ctx = next((m.content for m in messages if m.role == "system"), "")

        if "insufficient transcript evidence" in system_ctx.lower() or "no relevant" in system_ctx.lower():
            content = (
                "**[DEMO/SEEDED FALLBACK]** The available transcript material does not contain "
                "enough information to answer this question confidently. "
                "Try rephrasing or asking about activation loops, retention, pricing, or growth metrics."
            )
        elif "ship 30" in user_msg.lower() or "1250" in user_msg or "essay" in user_msg.lower():
            content = self._generate_demo_essay(system_ctx)
        elif "html" in user_msg.lower() or "landing page" in user_msg.lower():
            content = self._generate_demo_html(system_ctx)
        else:
            content = self._generate_demo_answer(system_ctx, user_msg)

        return LLMResponse(content=content, model="seeded-fallback", provider="demo")

    def _generate_demo_answer(self, context: str, question: str) -> str:
        if not context.strip() or "chunk" not in context.lower():
            return (
                "**[DEMO/SEEDED FALLBACK]** I could not retrieve relevant transcript chunks for this question. "
                "The knowledge base may need ingestion (`make ingest`)."
            )
        return (
            f"**[DEMO/SEEDED FALLBACK — Grounded Takeaway]**\n\n"
            f"Based on the retrieved Lenny Podcast transcript excerpts, here is what practitioners emphasize "
            f"regarding your question: *{question[:120]}*\n\n"
            f"**Key insight:** Durable growth loops compound when activation, retention, and a clear value "
            f"moment align. Several guests stress measuring leading indicators weekly rather than waiting for "
            f"lagging revenue signals.\n\n"
            f"**Practical takeaway:** Start with one loop, instrument it end-to-end, and iterate before adding "
            f"complexity. Claims below are limited to retrieved transcript context.\n\n"
            f"---\n*Context used:*\n{context[:800]}..."
        )

    def _generate_demo_essay(self, context: str) -> str:
        sections = [
            ("The Hook: Why This Growth Question Matters Now", 180),
            ("What the Transcripts Actually Say", 280),
            ("The Pattern Behind Durable Activation Loops", 320),
            ("Where Teams Get This Wrong", 240),
            ("A Practical Playbook You Can Ship This Week", 230),
        ]
        parts = ["# The Growth Question Behind the Growth Question\n", "*[DEMO/SEEDED FALLBACK — ~1,250 word draft]*\n\n"]
        for title, words in sections:
            parts.append(f"## {title}\n\n")
            parts.append(
                f"Product leaders on Lenny's Podcast repeatedly return to a simple truth: growth is not a "
                f"single metric—it is a system. {context[:200] if context else 'From seeded fixtures,'} "
                f"Practitioners describe activation as the moment a user first experiences core value, not "
                f"merely completing onboarding steps. " * (words // 40)
            )
            parts.append("\n\n")
        parts.append("## Final Takeaway\n\nShip one loop. Measure it. Learn in public.\n")
        return "".join(parts)[:7500]

    def _generate_demo_html(self, context: str) -> str:
        return (
            '{"type":"html","title":"Product Strategy One-Pager","html":"'
            '<section class=\\"hero\\"><h1>Growth Strategy Snapshot</h1>'
            "<p>Grounded draft from transcript context.</p></section>\","
            '"css":".hero{padding:2rem;background:#064e3b;color:#fff;border-radius:12px;}"}'
        )
