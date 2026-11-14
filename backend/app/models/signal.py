from sqlalchemy import Column, String, Text, Float, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from backend.app.db.base import Base
from backend.app.models.base import TimestampMixin, generate_uuid, get_utc_now

class IntelligenceSignal(Base, TimestampMixin):
    __tablename__ = "intelligence_signals"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    
    title = Column(String(512), nullable=False)
    pillar = Column(String(50), nullable=False, default="MARKET", index=True)  # CUSTOMER, COMPETITOR, MARKET
    urgency = Column(String(50), nullable=False, default="MEDIUM", index=True)  # LOW, MEDIUM, HIGH, CRITICAL
    direction = Column(String(50), nullable=False, default="NEUTRAL")  # OPPORTUNITY, THREAT, NEUTRAL
    
    # Strict separation between verified facts and AI interpretations
    verified_fact = Column(Text, nullable=False)  # Grounded quote/fact from source
    what_happened = Column(Text, nullable=True)  # Concrete event description
    publication_date = Column(DateTime(timezone=True), nullable=True)  # Real publication date (never invented)
    verification_status = Column(String(50), nullable=False, default="VERIFIED_SOURCE")  # VERIFIED_SOURCE, UNCONFIRMED, AI_SYNTHESIS
    business_impact = Column(String(50), nullable=False, default="MEDIUM")  # LOW, MEDIUM, HIGH, CRITICAL
    affected_business_area = Column(String(100), nullable=True)  # e.g. "Admissions & Counseling"
    ai_interpretation = Column(Text, nullable=False)  # Strategic implication & why it matters
    recommended_action = Column(Text, nullable=False)  # Recommended leadership action
    
    # Multi-factor transparent scoring breakdown
    confidence_score = Column(Float, nullable=False, default=0.85)
    source_reliability_score = Column(Float, nullable=False, default=85.0)
    evidence_strength_score = Column(Float, nullable=False, default=80.0)
    strategic_relevance_score = Column(Float, nullable=False, default=80.0)
    ranking_score = Column(Float, nullable=False, default=75.0, index=True)
    ranking_explanation = Column(Text, nullable=True)
    is_archived = Column(Boolean, nullable=False, default=False, index=True)

    # Relationships
    company = relationship("Company", back_populates="signals")
    evidences = relationship("SignalEvidence", back_populates="signal", cascade="all, delete-orphan", lazy="selectin")

class SignalEvidence(Base):
    __tablename__ = "signal_evidences"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    signal_id = Column(String(36), ForeignKey("intelligence_signals.id", ondelete="CASCADE"), nullable=False, index=True)
    crawled_document_id = Column(String(36), ForeignKey("crawled_documents.id", ondelete="SET NULL"), nullable=True)
    
    source_url = Column(String(1024), nullable=False)
    source_name = Column(String(255), nullable=False)
    exact_quote = Column(Text, nullable=False)
    published_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)

    # Relationships
    signal = relationship("IntelligenceSignal", back_populates="evidences")
    crawled_document = relationship("CrawledDocument", back_populates="evidence_items")
