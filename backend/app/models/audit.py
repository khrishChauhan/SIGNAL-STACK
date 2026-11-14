from sqlalchemy import Column, String, Integer, ForeignKey, JSON, Boolean, DateTime
from sqlalchemy.orm import relationship
from backend.app.db.base import Base
from backend.app.models.base import TimestampMixin, generate_uuid, get_utc_now

class SourceHealthReport(Base):
    __tablename__ = "source_health_reports"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    
    audit_date = Column(DateTime(timezone=True), default=get_utc_now, nullable=False, index=True)
    total_sources = Column(Integer, nullable=False, default=0)
    healthy_count = Column(Integer, nullable=False, default=0)
    warning_count = Column(Integer, nullable=False, default=0)
    broken_count = Column(Integer, nullable=False, default=0)
    dead_urls_count = Column(Integer, nullable=False, default=0)
    duplicate_sources_count = Column(Integer, nullable=False, default=0)
    inactive_sources_count = Column(Integer, nullable=False, default=0)
    average_latency_ms = Column(Integer, nullable=False, default=180)
    findings = Column(JSON, nullable=False, default=list)
    recommendations = Column(JSON, nullable=False, default=list)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)

    # Relationships
    company = relationship("Company", back_populates="health_reports")

class ScheduledJob(Base, TimestampMixin):
    __tablename__ = "scheduled_jobs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    
    job_name = Column(String(100), nullable=False)  # WEEKLY_BRIEF, MONTHLY_HEALTH_AUDIT, DAILY_CRAWL
    cron_expression = Column(String(100), nullable=False, default="0 6 * * 1")
    timezone = Column(String(50), nullable=False, default="UTC")
    briefing_day = Column(String(20), nullable=False, default="MON")
    briefing_time = Column(String(20), nullable=False, default="06:00")
    monitoring_frequency = Column(String(50), nullable=False, default="DAILY")
    is_active = Column(Boolean, nullable=False, default=True)
    last_run_at = Column(DateTime(timezone=True), nullable=True)
    next_run_at = Column(DateTime(timezone=True), nullable=True)
    last_status = Column(String(50), nullable=True)  # SUCCESS, FAILED, RUNNING
    last_duration_ms = Column(Integer, nullable=True)
    last_error = Column(String(500), nullable=True)
    execution_logs = Column(JSON, nullable=False, default=list)

    # Relationships
    company = relationship("Company", back_populates="scheduled_jobs")
