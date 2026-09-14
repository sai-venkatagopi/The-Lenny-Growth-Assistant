from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class ArtifactCreateRequest(BaseModel):
    session_id: UUID
    request: str = Field(min_length=1)
    type: str = "markdown"  # markdown | html
    skill: str | None = None  # ship30


class ArtifactOut(BaseModel):
    id: UUID
    session_id: UUID
    type: str
    title: str
    content: str
    css: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
