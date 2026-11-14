from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime

class ScheduleCreate(BaseModel):
    job_name: str = Field(..., description="WEEKLY_BRIEF, MONTHLY_HEALTH_AUDIT, or DAILY_CRAWL")
    cron_expression: str = Field(default="0 6 * * 1", description="Standard cron syntax")
    is_active: bool = True

class ScheduleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    company_id: str
    job_name: str
    cron_expression: str
    is_active: bool
    last_run_at: Optional[datetime] = None
    next_run_at: Optional[datetime] = None
    last_status: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class SourceAuditResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    company_id: str
    audit_date: datetime
    total_sources: int
    healthy_count: int
    warning_count: int
    broken_count: int
    findings: List[Dict[str, Any]] = []
    created_at: datetime
