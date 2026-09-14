from fastapi import APIRouter

from app.config import get_settings
from app.llm.ollama import OllamaProvider
from app.llm.router import ModelRouter

router = APIRouter(prefix="/api/health", tags=["health"])
settings = get_settings()


@router.get("")
async def health():
    return {
        "status": "ok",
        "service": "lenny-growth-assistant",
        "model_provider": settings.model_provider,
    }


@router.get("/ollama")
async def ollama_health():
    provider = OllamaProvider()
    result = await provider.health_check()
    return {
        "status": "ok" if result.get("available") else "degraded",
        **result,
    }


@router.get("/models-status")
async def models_status():
    router_svc = ModelRouter()
    ollama = await OllamaProvider().health_check()
    models = router_svc.list_models()
    return {"models": models, "ollama": ollama, "active_provider": settings.model_provider}
