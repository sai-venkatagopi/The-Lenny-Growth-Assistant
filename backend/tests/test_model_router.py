import pytest

from app.llm.base import LLMError, LLMMessage, LLMProvider, LLMResponse
from app.llm.demo import DemoProvider
from app.llm.router import ModelRouter


@pytest.mark.asyncio
async def test_demo_provider():
    provider = DemoProvider()
    health = await provider.health_check()
    assert health["available"] is True

    from app.llm.base import LLMMessage

    res = await provider.complete([LLMMessage(role="user", content="What is growth?")])
    assert "DEMO" in res.content or "transcript" in res.content.lower()


class DummyCloudProvider(LLMProvider):
    @property
    def provider_name(self) -> str:
        return "anthropic"

    @property
    def model_name(self) -> str:
        return "claude-3-5-haiku-20241022"

    async def complete(self, messages: list[LLMMessage], temperature: float = 0.3) -> LLMResponse:
        raise LLMError("AUTH_ERROR", "invalid x-api-key")

    async def health_check(self) -> dict:
        return {"available": True, "model": self.model_name}


@pytest.mark.asyncio
async def test_complete_with_fallback_on_cloud_auth_error_raises_instead_of_demo():
    router = ModelRouter()
    with pytest.raises(LLMError, match="invalid x-api-key"):
        await router.complete_with_fallback(
            DummyCloudProvider(),
            [LLMMessage(role="user", content="What is growth?")],
        )


def test_list_models():
    router = ModelRouter()
    models = router.list_models()
    providers = {m["provider"] for m in models}
    assert "ollama" in providers
    assert "anthropic" in providers
    assert "openai" in providers
