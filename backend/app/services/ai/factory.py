from typing import Optional
from backend.app.services.ai.base import AIServiceInterface
from backend.app.services.ai.ollama_provider import OllamaProvider
from backend.app.services.ai.fallback_provider import FallbackProvider
from backend.app.core.config import settings
from backend.app.core.logging import logger

class AIServiceFactory:
    """Factory to retrieve or switch AI provider instances."""
    _instance: Optional[AIServiceInterface] = None

    @classmethod
    def get_service(cls, force_fallback: bool = False) -> AIServiceInterface:
        if force_fallback or settings.AI_PROVIDER.lower() == "fallback":
            return FallbackProvider()

        # Default: Ollama Provider
        if cls._instance is None:
            cls._instance = OllamaProvider(
                base_url=settings.OLLAMA_BASE_URL,
                model=settings.OLLAMA_MODEL,
                timeout=settings.AI_TIMEOUT_SECONDS,
                max_retries=settings.AI_MAX_RETRIES
            )
        return cls._instance

    @classmethod
    def set_service(cls, service: AIServiceInterface) -> None:
        cls._instance = service

def get_ai_service(force_fallback: bool = False) -> AIServiceInterface:
    return AIServiceFactory.get_service(force_fallback=force_fallback)
