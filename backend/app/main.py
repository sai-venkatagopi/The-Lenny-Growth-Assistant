from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import artifacts, chat, health, models, sessions
from app.config import get_settings
from app.logging_config import setup_logging
from app.llm.base import LLMError

settings = get_settings()
setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(
    title="Lenny Growth Assistant",
    description="RAG-grounded product & growth advisor",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(sessions.router)
app.include_router(chat.router)
app.include_router(artifacts.router)
app.include_router(models.router)


@app.exception_handler(LLMError)
async def llm_error_handler(request: Request, exc: LLMError):
    return JSONResponse(
        status_code=503,
        content={"error": {"code": exc.code, "message": exc.message}},
    )


@app.get("/")
async def root():
    return {"service": "Lenny Growth Assistant", "docs": "/docs"}
