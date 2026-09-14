import structlog
import httpx

from app.config import get_settings
from app.llm.base import LLMError, LLMMessage, LLMProvider, LLMResponse

logger = structlog.get_logger(__name__)
settings = get_settings()


class OllamaProvider(LLMProvider):
    def __init__(
        self,
        base_url: str | None = None,
        model: str | None = None,
        timeout: float | None = None,
    ):
        self.base_url = (base_url or settings.ollama_base_url).rstrip("/")
        self._model = model or settings.ollama_model
        self.timeout = timeout or settings.llm_timeout_seconds

    @property
    def provider_name(self) -> str:
        return "ollama"

    @property
    def model_name(self) -> str:
        return self._model

    async def health_check(self) -> dict:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{self.base_url}/api/tags")
                response.raise_for_status()
                data = response.json()
                models = [m.get("name", "").split(":")[0] for m in data.get("models", [])]
                model_available = any(self._model in m for m in models)
                return {
                    "available": True,
                    "model_available": model_available,
                    "models": models,
                    "base_url": self.base_url,
                }
        except Exception as exc:
            logger.warning("ollama_health_failed", error=str(exc))
            return {"available": False, "model_available": False, "error": str(exc), "base_url": self.base_url}

    async def complete(self, messages: list[LLMMessage], temperature: float = 0.3) -> LLMResponse:
        payload = {
            "model": self._model,
            "messages": [{"role": m.role, "content": m.content} for m in messages],
            "stream": False,
            "options": {"temperature": temperature},
        }
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(f"{self.base_url}/api/chat", json=payload)
                if response.status_code == 404:
                    raise LLMError("MODEL_NOT_FOUND", f"Model {self._model} not found in Ollama. Run: ollama pull {self._model}")
                response.raise_for_status()
                data = response.json()
                content = data.get("message", {}).get("content", "")
                if not content:
                    raise LLMError("EMPTY_RESPONSE", "Ollama returned an empty response")
                return LLMResponse(content=content, model=self._model, provider="ollama")
        except httpx.TimeoutException as exc:
            raise LLMError("MODEL_TIMEOUT", f"Ollama request timed out after {self.timeout}s") from exc
        except httpx.ConnectError as exc:
            raise LLMError(
                "OLLAMA_UNAVAILABLE",
                "Ollama is unavailable. Start Ollama or switch to the cloud provider.",
            ) from exc
        except LLMError:
            raise
        except Exception as exc:
            logger.error("ollama_complete_failed", error=str(exc))
            raise LLMError("LLM_ERROR", f"Ollama error: {exc}") from exc
