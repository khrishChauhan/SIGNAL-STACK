from sqlalchemy import Column, String, Text, Integer, ForeignKey, JSON, DateTime, Boolean
from sqlalchemy.orm import relationship
from backend.app.db.base import Base
from backend.app.models.base import TimestampMixin, generate_uuid, get_utc_now

class CrawlJob(Base):
    __tablename__ = "crawl_jobs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    source_id = Column(String(36), ForeignKey("intelligence_sources.id", ondelete="SET NULL"), nullable=True)
    
    status = Column(String(50), nullable=False, default="PENDING", index=True)  # PENDING, RUNNING, COMPLETED, FAILED
    items_crawled = Column(Integer, nullable=False, default=0)
    items_extracted = Column(Integer, nullable=False, default=0)
    errors = Column(JSON, nullable=True)
    
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)

    # Relationships
    company = relationship("Company", back_populates="crawl_jobs")
    source = relationship("IntelligenceSource", back_populates="crawl_jobs")
    documents = relationship("CrawledDocument", back_populates="crawl_job")

class CrawledDocument(Base):
    __tablename__ = "crawled_documents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    source_id = Column(String(36), ForeignKey("intelligence_sources.id", ondelete="SET NULL"), nullable=True, index=True)
    crawl_job_id = Column(String(36), ForeignKey("crawl_jobs.id", ondelete="SET NULL"), nullable=True)
    
    url = Column(String(1024), nullable=False)
    canonical_url = Column(String(1024), nullable=True)
    title = Column(String(512), nullable=False, default="")
    raw_content = Column(Text, nullable=True)
    clean_text = Column(Text, nullable=False)
    author = Column(String(255), nullable=True)
    
    content_hash = Column(String(64), nullable=False, unique=True, index=True)
    simhash = Column(String(64), nullable=True, index=True)
    version = Column(Integer, nullable=False, default=1)
    previous_hash = Column(String(64), nullable=True)
    has_changed = Column(Boolean, nullable=False, default=False)
    
    published_at = Column(DateTime(timezone=True), nullable=True)
    crawled_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False, index=True)

    # Relationships
    company = relationship("Company", back_populates="crawled_documents")
    source = relationship("IntelligenceSource", back_populates="crawled_documents")
    crawl_job = relationship("CrawlJob", back_populates="documents")
    evidence_items = relationship("SignalEvidence", back_populates="crawled_document")
