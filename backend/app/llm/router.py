import structlog

from app.config import get_settings
from app.llm.base import LLMError, LLMMessage, LLMProvider, LLMResponse
from app.llm.cloud import AnthropicProvider, OpenAIProvider
from app.llm.demo import DemoProvider
from app.llm.ollama import OllamaProvider

logger = structlog.get_logger(__name__)
settings = get_settings()

_active_override: dict | None = None


def set_active_provider(provider: str, model: str | None = None) -> None:
    global _active_override
    _active_override = {"provider": provider, "model": model}


def get_active_override() -> dict | None:
    return _active_override


class ModelRouter:
    def __init__(self):
        self.settings = get_settings()

    def list_models(self) -> list[dict]:
        models = [
            {
                "id": "ollama/llama3.2",
                "provider": "ollama",
                "model": self.settings.ollama_model,
                "label": f"Ollama — {self.settings.ollama_model}",
                "is_default": self.settings.model_provider == "ollama",
            },
            {
                "id": f"anthropic/{self.settings.anthropic_model}",
                "provider": "anthropic",
                "model": self.settings.anthropic_model,
                "label": f"Anthropic — {self.settings.anthropic_model}",
                "is_default": self.settings.model_provider == "anthropic",
            },
            {
                "id": f"openai/{self.settings.openai_model}",
                "provider": "openai",
                "model": self.settings.openai_model,
                "label": f"OpenAI — {self.settings.openai_model}",
                "is_default": self.settings.model_provider == "openai",
            },
        ]
        if self.settings.demo_fallback_enabled:
            models.append(
                {
                    "id": "demo/seeded-fallback",
                    "provider": "demo",
                    "model": "seeded-fallback",
                    "label": "Demo — Seeded Fallback",
                    "is_default": self.settings.model_provider == "demo",
                }
            )
        return models

    def get_provider(self, provider: str | None = None, model: str | None = None) -> LLMProvider:
        override = get_active_override()
        selected = provider or (override or {}).get("provider") or self.settings.model_provider
        selected_model = model or (override or {}).get("model")

        if selected == "ollama":
            return OllamaProvider(model=selected_model or self.settings.ollama_model)
        if selected == "anthropic":
            return AnthropicProvider(model=selected_model or self.settings.anthropic_model)
        if selected == "openai":
            return OpenAIProvider(model=selected_model or self.settings.openai_model)
        if selected == "demo":
            return DemoProvider()
        raise LLMError("INVALID_PROVIDER", f"Unknown provider: {selected}")

    async def get_provider_with_fallback(self) -> tuple[LLMProvider, bool]:
        """Returns (provider, used_fallback)."""
        override = get_active_override()
        selected = (override or {}).get("provider") or self.settings.model_provider

        if selected == "demo":
            return DemoProvider(), True

        provider = self.get_provider()
        if selected == "ollama":
            health = await provider.health_check()
            if not health.get("available") or not health.get("model_available", True):
                if self.settings.demo_fallback_enabled:
                    logger.warning("ollama_unavailable_using_demo_fallback")
                    return DemoProvider(), True
                raise LLMError("OLLAMA_UNAVAILABLE", "Ollama is unavailable. Start Ollama or switch to cloud.")
        return provider, False

    async def complete_with_fallback(
        self,
        provider: LLMProvider,
        messages: list[LLMMessage],
        temperature: float = 0.3,
    ) -> LLMResponse:
        try:
            return await provider.complete(messages, temperature=temperature)
        except LLMError:
            if provider.provider_name in {"anthropic", "openai"}:
                raise
            if self.settings.demo_fallback_enabled:
                logger.warning("non_cloud_provider_failed_falling_back", provider=provider.provider_name)
                return await DemoProvider().complete(messages, temperature=temperature)
            raise
