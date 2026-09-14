from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.chat import SourceCitation


class SessionCreateRequest(BaseModel):
    title: str = "New conversation"


class MessageOut(BaseModel):
    id: UUID
    role: str
    content: str
    model_used: str | None = None
    sources: list[SourceCitation] | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class SessionOut(BaseModel):
    id: UUID
    title: str
    created_at: datetime
    updated_at: datetime
    messages: list[MessageOut] = []

    model_config = {"from_attributes": True}


class SessionSummary(BaseModel):
    id: UUID
    title: str
    created_at: datetime
    updated_at: datetime
    message_count: int = 0
