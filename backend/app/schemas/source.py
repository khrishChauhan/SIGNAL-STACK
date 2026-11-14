from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime

class SourceCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    url: str = Field(..., min_length=3, max_length=1024)
    source_type: str = Field(default="RSS", pattern="^(RSS|WEBPAGE|NEWS_SEARCH|FORUM)$")
    pillar: str = Field(default="MARKET", pattern="^(CUSTOMER|COMPETITOR|MARKET)$")
    expected_frequency: str = Field(default="DAILY", pattern="^(HOURLY|DAILY|WEEKLY)$")
    reliability_score: float = Field(default=0.8, ge=0.0, le=1.0)
    approval_status: str = Field(default="APPROVED", pattern="^(DISCOVERED|APPROVED|REJECTED|CUSTOM)$")

class SourceUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    url: Optional[str] = Field(None, min_length=3, max_length=1024)
    source_type: Optional[str] = None
    pillar: Optional[str] = None
    expected_frequency: Optional[str] = None
    reliability_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    approval_status: Optional[str] = None
    health_status: Optional[str] = None

class SourceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    company_id: str
    name: str
    url: str
    source_type: str
    pillar: str
    expected_frequency: str
    reliability_score: float
    relevance_score: float = 0.85
    reason_for_inclusion: Optional[str] = None
    approval_status: str
    health_status: str
    consecutive_failures: int
    last_crawled_at: Optional[datetime] = None
    last_success_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

class SourceDiscoverRequest(BaseModel):
    categories: Optional[List[str]] = Field(default=["COMPETITOR", "CUSTOMER", "MARKET"])
    max_sources: int = Field(default=20, ge=5, le=50)

class CompetitorCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    website_url: str = Field(..., min_length=3, max_length=512)
    tier: str = Field(default="DIRECT", pattern="^(DIRECT|INDIRECT|ASPIRATIONAL|EMERGING)$")
    notes: Optional[str] = None

class CompetitorResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    company_id: str
    name: str
    website_url: str
    tier: str
    notes: Optional[str] = None
    is_active: bool
    created_at: datetime
