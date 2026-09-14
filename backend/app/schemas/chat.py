from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class SourceCitation(BaseModel):
    chunk_id: str | None = None
    title: str
    url: str | None = None
    speaker: str | None = None
    snippet: str
    relevance: float


class ChatRequest(BaseModel):
    session_id: UUID
    message: str = Field(min_length=1, max_length=8000)
    action: str | None = None  # ship30 | artifact | None


class ChatResponse(BaseModel):
    id: UUID
    session_id: UUID
    role: str = "assistant"
    content: str
    sources: list[SourceCitation] = []
    model: str
    artifact: dict | None = None
    created_at: datetime | None = None


class ErrorDetail(BaseModel):
    code: str
    message: str


class ErrorResponse(BaseModel):
    error: ErrorDetail
