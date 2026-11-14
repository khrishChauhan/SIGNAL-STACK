from sqlalchemy import Column, String, Text, Float, Integer, ForeignKey, Boolean, DateTime
from sqlalchemy.orm import relationship
from backend.app.db.base import Base
from backend.app.models.base import TimestampMixin, generate_uuid

class IntelligenceSource(Base, TimestampMixin):
    __tablename__ = "intelligence_sources"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    
    name = Column(String(255), nullable=False)
    url = Column(String(1024), nullable=False)
    source_type = Column(String(50), nullable=False, default="RSS")  # RSS, WEBPAGE, NEWS_SEARCH, FORUM
    pillar = Column(String(50), nullable=False, default="MARKET", index=True)  # CUSTOMER, COMPETITOR, MARKET
    expected_frequency = Column(String(50), nullable=False, default="DAILY")  # HOURLY, DAILY, WEEKLY
    
    reliability_score = Column(Float, nullable=False, default=0.8)
    relevance_score = Column(Float, nullable=False, default=0.85)
    reason_for_inclusion = Column(Text, nullable=True)
    approval_status = Column(String(50), nullable=False, default="DISCOVERED", index=True)  # DISCOVERED, APPROVED, REJECTED, CUSTOM
    health_status = Column(String(50), nullable=False, default="HEALTHY", index=True)  # HEALTHY, WARNING, BROKEN, STALE
    consecutive_failures = Column(Integer, nullable=False, default=0)
    
    last_crawled_at = Column(DateTime(timezone=True), nullable=True)
    last_success_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    company = relationship("Company", back_populates="sources")
    crawled_documents = relationship("CrawledDocument", back_populates="source", cascade="all, delete-orphan")
    crawl_jobs = relationship("CrawlJob", back_populates="source")

class Competitor(Base, TimestampMixin):
    __tablename__ = "competitors"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    
    name = Column(String(255), nullable=False, index=True)
    website_url = Column(String(512), nullable=False)
    tier = Column(String(50), nullable=False, default="DIRECT")  # DIRECT, INDIRECT, ASPIRATIONAL, EMERGING
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)

    # Relationships
    company = relationship("Company", back_populates="competitors")
