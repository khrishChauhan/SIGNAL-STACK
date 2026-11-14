from typing import Any, Optional
from fastapi import HTTPException, status

class SignalStackException(Exception):
    """Base exception for Signal Stack."""
    def __init__(self, message: str, code: str = "SIGNAL_STACK_ERROR", details: Optional[Any] = None):
        self.message = message
        self.code = code
        self.details = details
        super().__init__(message)

class ResourceNotFoundError(SignalStackException):
    def __init__(self, resource: str, resource_id: str):
        super().__init__(
            message=f"{resource} with ID '{resource_id}' was not found.",
            code="RESOURCE_NOT_FOUND",
            details={"resource": resource, "id": resource_id}
        )

class CompanyNotFoundError(ResourceNotFoundError):
    def __init__(self, company_id: str):
        super().__init__("Company", company_id)

class AIProviderUnavailableError(SignalStackException):
    def __init__(self, provider: str, reason: str):
        super().__init__(
            message=f"AI Provider '{provider}' is currently unavailable: {reason}",
            code="AI_PROVIDER_UNAVAILABLE",
            details={"provider": provider, "reason": reason}
        )

class AIModelNotFoundError(SignalStackException):
    def __init__(self, model: str):
        super().__init__(
            message=f"Model '{model}' is not available in the active AI provider.",
            code="AI_MODEL_NOT_FOUND",
            details={"model": model}
        )

class CrawlExecutionError(SignalStackException):
    def __init__(self, url: str, reason: str):
        super().__init__(
            message=f"Crawling failed for URL '{url}': {reason}",
            code="CRAWL_FAILED",
            details={"url": url, "reason": reason}
        )

class FileUploadValidationError(SignalStackException):
    def __init__(self, reason: str):
        super().__init__(
            message=f"File upload validation failed: {reason}",
            code="FILE_UPLOAD_INVALID",
            details={"reason": reason}
        )
