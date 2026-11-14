from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

class AIServiceInterface(ABC):
    """Abstract Base Class for AI Providers."""

    @abstractmethod
    async def check_health(self) -> Dict[str, Any]:
        """Check provider connectivity and model availability."""
        pass

    @abstractmethod
    async def generate_text(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """Generate unstructured text with timeout and retry logic."""
        pass

    @abstractmethod
    async def generate_json(
        self,
        prompt: str,
        schema: Optional[Dict[str, Any]] = None,
        system_prompt: Optional[str] = None
    ) -> Dict[str, Any]:
        """Generate strictly structured JSON conforming to expected schema."""
        pass
