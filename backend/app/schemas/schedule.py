from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime

class ScheduleCreate(BaseModel):
    job_name: str = Field(..., description="WEEKLY_BRIEF, MONTHLY_HEALTH_AUDIT, or DAILY_CRAWL")
    cron_expression: str = Field(default="0 6 * * 1", description="Standard cron syntax")
    timezone: str = Field(default="UTC", description="IANA timezone e.g. UTC, America/New_York")
    briefing_day: str = Field(default="MON", description="Briefing day: MON, TUE, WED, THU, FRI, SAT, SUN")
    briefing_time: str = Field(default="06:00", description="HH:MM briefing trigger time")
    monitoring_frequency: str = Field(default="DAILY", description="DAILY, HOURLY, WEEKLY")
    is_active: bool = True

class ScheduleUpdate(BaseModel):
    cron_expression: Optional[str] = None
    timezone: Optional[str] = None
    briefing_day: Optional[str] = None
    briefing_time: Optional[str] = None
    monitoring_frequency: Optional[str] = None
    is_active: Optional[bool] = None

class ScheduleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    company_id: str
    job_name: str
    cron_expression: str
    timezone: str = "UTC"
    briefing_day: str = "MON"
    briefing_time: str = "06:00"
    monitoring_frequency: str = "DAILY"
    is_active: bool
    last_run_at: Optional[datetime] = None
    next_run_at: Optional[datetime] = None
    last_status: Optional[str] = None
    last_duration_ms: Optional[int] = None
    last_error: Optional[str] = None
    execution_logs: List[Dict[str, Any]] = []
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
    dead_urls_count: int = 0
    duplicate_sources_count: int = 0
    inactive_sources_count: int = 0
    average_latency_ms: int = 180
    findings: List[Dict[str, Any]] = []
    recommendations: List[Dict[str, Any]] = []
    created_at: datetime
