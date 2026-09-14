from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field


class SkillName(str, Enum):
    GROUNDED_QA = "grounded_qa"
    SHIP30_WRITER = "ship30_writer"
    ARTIFACT_GENERATOR = "artifact_generator"


class ChatIntent(BaseModel):
    skill: SkillName = SkillName.GROUNDED_QA
    artifact_type: Literal["markdown", "html"] | None = None
    topic: str | None = None


def detect_intent(message: str, action: str | None = None) -> ChatIntent:
    lower = message.lower()

    if action == "ship30" or "ship 30" in lower or "ship30" in lower:
        return ChatIntent(skill=SkillName.SHIP30_WRITER, topic=message)

    if action == "artifact":
        if "html" in lower or "landing page" in lower or "css" in lower:
            return ChatIntent(skill=SkillName.ARTIFACT_GENERATOR, artifact_type="html", topic=message)
        return ChatIntent(skill=SkillName.ARTIFACT_GENERATOR, artifact_type="markdown", topic=message)

    if any(kw in lower for kw in ["create a", "generate a", "build a", "one-page", "template", "document"]):
        if "html" in lower or "landing" in lower or "page" in lower:
            return ChatIntent(skill=SkillName.ARTIFACT_GENERATOR, artifact_type="html", topic=message)
        return ChatIntent(skill=SkillName.ARTIFACT_GENERATOR, artifact_type="markdown", topic=message)

    return ChatIntent(skill=SkillName.GROUNDED_QA)
