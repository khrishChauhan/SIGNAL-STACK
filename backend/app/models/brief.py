from sqlalchemy import Column, String, Text, ForeignKey, JSON, DateTime
from sqlalchemy.orm import relationship
from backend.app.db.base import Base
from backend.app.models.base import TimestampMixin, generate_uuid, get_utc_now

class IntelligenceBrief(Base, TimestampMixin):
    __tablename__ = "intelligence_briefs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    
    brief_week = Column(String(20), nullable=False, index=True)  # e.g. "2026-W46"
    title = Column(String(255), nullable=False)
    
    executive_tldr = Column(JSON, nullable=False, default=list)  # List of strings
    strategic_alert = Column(JSON, nullable=False, default=dict)  # Alert dict
    competitor_movements = Column(JSON, nullable=False, default=list)  # List of competitor updates
    market_shifts = Column(JSON, nullable=False, default=list)  # List of market/regulatory shifts
    customer_voice = Column(JSON, nullable=False, default=list)  # List of customer sentiments
    internal_alignment = Column(JSON, nullable=False, default=list)  # List of RAG internal cross-refs
    cited_signal_ids = Column(JSON, nullable=False, default=list)  # List of signal UUIDs
    
    status = Column(String(50), nullable=False, default="PUBLISHED", index=True)  # DRAFT, PUBLISHED, ARCHIVED
    generated_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False, index=True)

    # Relationships
    company = relationship("Company", back_populates="briefs")
    actions = relationship("BriefAction", back_populates="brief", cascade="all, delete-orphan", lazy="selectin")

class BriefAction(Base):
    __tablename__ = "brief_actions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    brief_id = Column(String(36), ForeignKey("intelligence_briefs.id", ondelete="CASCADE"), nullable=False, index=True)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    
    priority = Column(String(10), nullable=False, default="P1")  # P0, P1, P2
    action_text = Column(Text, nullable=False)
    owner = Column(String(100), nullable=False, default="Leadership")
    deadline = Column(String(100), nullable=True)
    status = Column(String(50), nullable=False, default="PENDING")  # PENDING, IN_PROGRESS, COMPLETED
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)

    # Relationships
    brief = relationship("IntelligenceBrief", back_populates="actions")
