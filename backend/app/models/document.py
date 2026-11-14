from sqlalchemy import Column, String, Text, Integer, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from backend.app.db.base import Base
from backend.app.models.base import TimestampMixin, generate_uuid, get_utc_now

class InternalDocument(Base, TimestampMixin):
    __tablename__ = "internal_documents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    
    filename = Column(String(255), nullable=False)
    file_type = Column(String(20), nullable=False)  # PDF, DOCX, CSV, XLSX, TXT
    file_path = Column(String(1024), nullable=False)
    file_size_bytes = Column(Integer, nullable=False, default=0)
    chunk_count = Column(Integer, nullable=False, default=0)
    status = Column(String(50), nullable=False, default="INDEXED", index=True)  # PENDING, INDEXED, FAILED
    summary = Column(Text, nullable=True)
    
    uploaded_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False, index=True)

    # Relationships
    company = relationship("Company", back_populates="internal_documents")
