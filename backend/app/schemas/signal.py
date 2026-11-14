from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime

class EvidenceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    signal_id: str
    crawled_document_id: Optional[str] = None
    source_url: str
    source_name: str
    exact_quote: str
    published_at: Optional[datetime] = None
    created_at: datetime

class SignalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    company_id: str
    title: str
    headline: Optional[str] = None
    summary: Optional[str] = None
    pillar: str
    urgency: str
    direction: str
    what_happened: Optional[str] = None
    publication_date: Optional[datetime] = None
    verification_status: str = "VERIFIED_SOURCE"
    business_impact: str = "MEDIUM"
    affected_business_area: Optional[str] = None
    verified_fact: str
    ai_interpretation: str
    recommended_action: str
    confidence_score: float
    source_reliability_score: float = 85.0
    evidence_strength_score: float = 80.0
    strategic_relevance_score: float = 80.0
    ranking_score: float
    ranking_explanation: Optional[str] = None
    is_archived: bool
    created_at: datetime
    updated_at: datetime
    evidences: List[EvidenceResponse] = []

class SignalDetailResponse(SignalResponse):
    pass

class SignalAnalyseRequest(BaseModel):
    min_confidence: float = Field(default=0.7, ge=0.0, le=1.0)
    limit_documents: int = Field(default=20, ge=1, le=100)
