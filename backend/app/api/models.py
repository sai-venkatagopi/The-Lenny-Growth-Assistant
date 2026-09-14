from fastapi import APIRouter
from pydantic import BaseModel

from app.config import get_settings
from app.llm.router import ModelRouter, set_active_provider

router = APIRouter(prefix="/api/models", tags=["models"])


class ModelSwitchRequest(BaseModel):
    provider: str
    model: str | None = None


@router.get("")
async def list_models():
    router_svc = ModelRouter()
    settings = get_settings()
    from app.llm.ollama import OllamaProvider

    ollama_health = await OllamaProvider().health_check()
    return {
        "models": router_svc.list_models(),
        "active": {
            "provider": settings.model_provider,
            "ollama_available": ollama_health.get("available", False),
        },
    }


@router.patch("/active")
async def switch_model(body: ModelSwitchRequest):
    set_active_provider(body.provider, body.model)
    router_svc = ModelRouter()
    provider = router_svc.get_provider(body.provider, body.model)
    return {
        "provider": body.provider,
        "model": body.model or provider.model_name,
        "display": provider.display_name,
    }
