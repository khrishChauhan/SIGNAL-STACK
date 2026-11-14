import json
import asyncio
from typing import Dict, Any, Optional
import httpx
from backend.app.services.ai.base import AIServiceInterface
from backend.app.core.config import settings
from backend.app.core.logging import logger
from backend.app.core.errors import AIProviderUnavailableError, AIModelNotFoundError

class OllamaProvider(AIServiceInterface):
    """Ollama local AI provider with structured JSON, retry, and availability checking."""

    def __init__(
        self,
        base_url: Optional[str] = None,
        model: Optional[str] = None,
        timeout: Optional[int] = None,
        max_retries: Optional[int] = None
    ):
        self.base_url = (base_url or settings.OLLAMA_BASE_URL).rstrip("/")
        self.model = model or settings.OLLAMA_MODEL
        self.timeout = timeout or settings.AI_TIMEOUT_SECONDS
        self.max_retries = max_retries or settings.AI_MAX_RETRIES

    async def check_health(self) -> Dict[str, Any]:
        """Verify Ollama daemon is reachable and requested model exists."""
        tags_url = f"{self.base_url}/api/tags"
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(tags_url)
                if res.status_code != 200:
                    return {
                        "available": False,
                        "provider": "ollama",
                        "model": self.model,
                        "reason": f"Ollama daemon returned HTTP {res.status_code}"
                    }
                data = res.json()
                models = [m.get("name", "") for m in data.get("models", [])]
                # Match full or prefix (e.g. "llama3.2" matches "llama3.2:latest")
                model_exists = any(self.model in m for m in models)
                return {
                    "available": model_exists,
                    "provider": "ollama",
                    "model": self.model,
                    "installed_models": models,
                    "reason": "Model available" if model_exists else f"Model '{self.model}' not found in Ollama. Run: ollama pull {self.model}"
                }
        except httpx.ConnectError:
            return {
                "available": False,
                "provider": "ollama",
                "model": self.model,
                "reason": f"Cannot connect to Ollama daemon at {self.base_url}. Ensure Ollama is running."
            }
        except Exception as e:
            return {
                "available": False,
                "provider": "ollama",
                "model": self.model,
                "reason": f"Ollama health check error: {str(e)}"
            }

    async def _execute_with_retry(self, endpoint: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        last_error = None

        for attempt in range(1, self.max_retries + 2):
            try:
                async with httpx.AsyncClient(timeout=float(self.timeout)) as client:
                    response = await client.post(url, json=payload)
                    if response.status_code == 404:
                        raise AIModelNotFoundError(self.model)
                    response.raise_for_status()
                    return response.json()
            except AIModelNotFoundError:
                raise
            except httpx.ConnectError:
                raise AIProviderUnavailableError(
                    provider="ollama",
                    reason=f"Cannot reach Ollama at {self.base_url}. Is Ollama installed and running?"
                )
            except (httpx.TimeoutException, httpx.HTTPStatusError) as e:
                last_error = e
                logger.warning(f"Ollama request attempt {attempt} failed: {e}. Retrying...")
                if attempt <= self.max_retries:
                    await asyncio.sleep(1.0 * attempt)

        raise AIProviderUnavailableError(
            provider="ollama",
            reason=f"Request timed out or failed after {self.max_retries + 1} attempts: {last_error}"
        )

    async def generate_text(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False
        }
        if system_prompt:
            payload["system"] = system_prompt

        res = await self._execute_with_retry("/api/generate", payload)
        return res.get("response", "").strip()

    async def generate_json(
        self,
        prompt: str,
        schema: Optional[Dict[str, Any]] = None,
        system_prompt: Optional[str] = None
    ) -> Dict[str, Any]:
        """Request JSON formatted output from Ollama and validate parsing."""
        instruction = "Respond ONLY with a valid JSON object matching the requested schema. Do not include markdown codeblocks or explanations outside the JSON."
        full_system = f"{system_prompt}\n{instruction}" if system_prompt else instruction

        payload = {
            "model": self.model,
            "prompt": prompt,
            "format": "json",
            "stream": False,
            "system": full_system
        }

        res = await self._execute_with_retry("/api/generate", payload)
        raw_text = res.get("response", "").strip()

        # Clean markdown codeblocks if Ollama accidentally wrapped it
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:]
        if raw_text.startswith("```"):
            raw_text = raw_text[3:]
        if raw_text.endswith("```"):
            raw_text = raw_text[:-3]
        raw_text = raw_text.strip()

        try:
            return json.loads(raw_text)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to decode Ollama JSON output: {raw_text}")
            raise AIProviderUnavailableError(
                provider="ollama",
                reason=f"Model output was not valid JSON: {str(e)}"
            )
