import pytest
from backend.app.services.ai.ollama_provider import OllamaProvider
from backend.app.services.ai.fallback_provider import FallbackProvider
from backend.app.core.errors import AIProviderUnavailableError

@pytest.mark.asyncio
async def test_ollama_provider_health_check_offline():
    """Verify Ollama does not pretend to be online when the daemon is unreachable."""
    provider = OllamaProvider(base_url="http://localhost:9999", timeout=2)
    health = await provider.check_health()
    assert health["available"] is False
    assert "Cannot connect" in health["reason"] or "error" in health["reason"]

@pytest.mark.asyncio
async def test_ollama_provider_raises_error_when_offline():
    """Verify provider raises explicit error instead of silent fake success."""
    provider = OllamaProvider(base_url="http://localhost:9999", timeout=1, max_retries=0)
    with pytest.raises(AIProviderUnavailableError) as exc_info:
        await provider.generate_text("Test prompt")
    assert "Cannot reach Ollama" in str(exc_info.value) or "timed out" in str(exc_info.value)

@pytest.mark.asyncio
async def test_fallback_provider_deterministic_operations():
    """Verify fallback provider executes deterministic, non-hallucinatory operations."""
    fallback = FallbackProvider()
    health = await fallback.check_health()
    assert health["available"] is True
    assert health["provider"] == "fallback"

    # Test company profile synthesis
    profile = await fallback.generate_json("Synthesize Company Profile for Company Name: MeetUniversity, Website: https://meetuniversity.com")
    assert "MeetUniversity" in profile["executive_summary"]
    assert len(profile["identified_competitors"]) > 0
    assert profile["is_fallback"] is True

    # Test adaptive question generation
    question = await fallback.generate_json("Generate Question interview question_number: 1 for company: MeetUniversity")
    assert question["question_number"] == 1
    assert "moat" in question["question_text"].lower() or "meetuniversity" in question["question_text"].lower()
