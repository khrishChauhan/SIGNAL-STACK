from sqlalchemy import Column, String, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from backend.app.db.base import Base
from backend.app.models.base import TimestampMixin, generate_uuid

class Company(Base, TimestampMixin):
    __tablename__ = "companies"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False, index=True)
    website_url = Column(String(512), nullable=False)
    industry = Column(String(100), nullable=True)
    geography = Column(String(100), nullable=True)
    onboarding_status = Column(
        String(50),
        nullable=False,
        default="REGISTERED",
        index=True
    )  # REGISTERED, RESEARCHING, RESEARCHED, INTERVIEW_IN_PROGRESS, INTERVIEW_COMPLETED, ACTIVE

    # Relationships
    profile = relationship("CompanyProfile", back_populates="company", uselist=False, cascade="all, delete-orphan", lazy="selectin")
    interview_sessions = relationship("InterviewSession", back_populates="company", cascade="all, delete-orphan")
    sources = relationship("IntelligenceSource", back_populates="company", cascade="all, delete-orphan")
    competitors = relationship("Competitor", back_populates="company", cascade="all, delete-orphan")
    crawl_jobs = relationship("CrawlJob", back_populates="company", cascade="all, delete-orphan")
    crawled_documents = relationship("CrawledDocument", back_populates="company", cascade="all, delete-orphan")
    signals = relationship("IntelligenceSignal", back_populates="company", cascade="all, delete-orphan")
    briefs = relationship("IntelligenceBrief", back_populates="company", cascade="all, delete-orphan")
    internal_documents = relationship("InternalDocument", back_populates="company", cascade="all, delete-orphan")
    health_reports = relationship("SourceHealthReport", back_populates="company", cascade="all, delete-orphan")
    scheduled_jobs = relationship("ScheduledJob", back_populates="company", cascade="all, delete-orphan")

class CompanyProfile(Base, TimestampMixin):
    __tablename__ = "company_profiles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    executive_summary = Column(Text, nullable=False, default="")
    value_proposition = Column(Text, nullable=False, default="")
    target_customer_profile = Column(Text, nullable=False, default="")
    business_model = Column(String(100), nullable=False, default="Unknown")
    core_strengths = Column(JSON, nullable=False, default=list)
    known_weaknesses = Column(JSON, nullable=False, default=list)
    raw_research_data = Column(JSON, nullable=False, default=dict)

    # Relationships
    company = relationship("Company", back_populates="profile")
