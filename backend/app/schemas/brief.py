from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime

class BriefActionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    brief_id: str
    company_id: str
    priority: str
    action_text: str
    owner: str
    deadline: Optional[str] = None
    status: str
    created_at: datetime

class BriefResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    company_id: str
    brief_week: str
    title: str
    executive_tldr: List[str] = []
    strategic_alert: Dict[str, Any] = {}
    competitor_movements: List[Dict[str, Any]] = []
    market_shifts: List[Dict[str, Any]] = []
    customer_voice: List[Dict[str, Any]] = []
    internal_alignment: List[Dict[str, Any]] = []
    opportunities: List[Dict[str, Any]] = []
    risks_and_threats: List[Dict[str, Any]] = []
    what_to_watch: List[str] = []
    source_appendix: List[Dict[str, Any]] = []
    cited_signal_ids: List[str] = []
    status: str
    generated_at: datetime
    created_at: datetime
    actions: List[BriefActionResponse] = []

class BriefGenerateRequest(BaseModel):
    week_identifier: Optional[str] = Field(None, description="e.g. 2026-W46; defaults to current week")
    force_refresh: bool = False
