import structlog

from app.config import get_settings
from app.llm.base import LLMError, LLMMessage, LLMProvider, LLMResponse

logger = structlog.get_logger(__name__)
settings = get_settings()


class AnthropicProvider(LLMProvider):
    def __init__(self, api_key: str | None = None, model: str | None = None):
        self._api_key = api_key or settings.anthropic_api_key
        self._model = model or settings.anthropic_model

    @property
    def provider_name(self) -> str:
        return "anthropic"

    @property
    def model_name(self) -> str:
        return self._model

    async def health_check(self) -> dict:
        if not self._api_key:
            return {"available": False, "error": "ANTHROPIC_API_KEY not set"}
        return {"available": True, "model": self._model}

    async def complete(self, messages: list[LLMMessage], temperature: float = 0.3) -> LLMResponse:
        if not self._api_key:
            raise LLMError("API_KEY_MISSING", "ANTHROPIC_API_KEY not set.")
        try:
            import anthropic

            client = anthropic.AsyncAnthropic(api_key=self._api_key)
            system = ""
            chat_messages = []
            for m in messages:
                if m.role == "system":
                    system = m.content
                else:
                    chat_messages.append({"role": m.role, "content": m.content})

            kwargs = {
                "model": self._model,
                "max_tokens": 4096,
                "temperature": temperature,
                "messages": chat_messages,
            }
            if system:
                kwargs["system"] = system

            response = await client.messages.create(**kwargs)
            content = response.content[0].text if response.content else ""
            return LLMResponse(content=content, model=self._model, provider="anthropic")
        except LLMError:
            raise
        except Exception as exc:
            logger.error("anthropic_complete_failed", error=str(exc))
            raise LLMError("LLM_ERROR", f"Anthropic error: {exc}") from exc


class OpenAIProvider(LLMProvider):
    def __init__(self, api_key: str | None = None, model: str | None = None):
        self._api_key = api_key or settings.openai_api_key
        self._model = model or settings.openai_model

    @property
    def provider_name(self) -> str:
        return "openai"

    @property
    def model_name(self) -> str:
        return self._model

    async def health_check(self) -> dict:
        if not self._api_key:
            return {"available": False, "error": "OPENAI_API_KEY not set"}
        return {"available": True, "model": self._model}

    async def complete(self, messages: list[LLMMessage], temperature: float = 0.3) -> LLMResponse:
        if not self._api_key:
            raise LLMError("API_KEY_MISSING", "OPENAI_API_KEY not set.")
        try:
            from openai import AsyncOpenAI

            client = AsyncOpenAI(api_key=self._api_key)
            response = await client.chat.completions.create(
                model=self._model,
                messages=[{"role": m.role, "content": m.content} for m in messages],
                temperature=temperature,
            )
            content = response.choices[0].message.content or ""
            return LLMResponse(content=content, model=self._model, provider="openai")
        except LLMError:
            raise
        except Exception as exc:
            logger.error("openai_complete_failed", error=str(exc))
            raise LLMError("LLM_ERROR", f"OpenAI error: {exc}") from exc
