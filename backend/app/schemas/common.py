from typing import Generic, TypeVar, Optional, Any, List
from pydantic import BaseModel, Field
from datetime import datetime, timezone

T = TypeVar("T")

class ErrorDetail(BaseModel):
    code: str
    message: str
    details: Optional[Any] = None

class APIResponse(BaseModel, Generic[T]):
    success: bool = True
    data: Optional[T] = None
    message: str = "Operation completed successfully"
    error: Optional[ErrorDetail] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PaginationMeta(BaseModel):
    total: int
    page: int
    limit: int
    total_pages: int

class PaginatedResponse(BaseModel, Generic[T]):
    success: bool = True
    data: List[T]
    pagination: PaginationMeta
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
