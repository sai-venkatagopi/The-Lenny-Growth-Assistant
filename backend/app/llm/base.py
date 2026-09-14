from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class LLMMessage:
    role: str
    content: str


@dataclass
class LLMResponse:
    content: str
    model: str
    provider: str


class LLMProvider(ABC):
    @property
    @abstractmethod
    def provider_name(self) -> str:
        pass

    @property
    @abstractmethod
    def model_name(self) -> str:
        pass

    @abstractmethod
    async def complete(self, messages: list[LLMMessage], temperature: float = 0.3) -> LLMResponse:
        pass

    @abstractmethod
    async def health_check(self) -> dict:
        pass

    @property
    def display_name(self) -> str:
        return f"{self.provider_name}/{self.model_name}"


class LLMError(Exception):
    def __init__(self, code: str, message: str):
        self.code = code
        self.message = message
        super().__init__(message)
