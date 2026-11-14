from sqlalchemy import Column, String, Text, Integer, ForeignKey, JSON, Boolean, DateTime
from sqlalchemy.orm import relationship
from backend.app.db.base import Base
from backend.app.models.base import TimestampMixin, generate_uuid, get_utc_now

class InterviewSession(Base, TimestampMixin):
    __tablename__ = "interview_sessions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    
    status = Column(String(50), nullable=False, default="NOT_STARTED", index=True)  # NOT_STARTED, IN_PROGRESS, COMPLETED, ABANDONED
    current_question_number = Column(Integer, nullable=False, default=1)
    total_questions = Column(Integer, nullable=False, default=10)
    strategic_priorities = Column(JSON, nullable=False, default=dict)
    
    started_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    company = relationship("Company", back_populates="interview_sessions")
    questions = relationship("InterviewQuestion", back_populates="session", cascade="all, delete-orphan", order_by="InterviewQuestion.question_number", lazy="selectin")
    answers = relationship("InterviewAnswer", back_populates="session", cascade="all, delete-orphan", order_by="InterviewAnswer.question_number", lazy="selectin")

class InterviewQuestion(Base):
    __tablename__ = "interview_questions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_id = Column(String(36), ForeignKey("interview_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    
    question_number = Column(Integer, nullable=False, index=True)
    question_text = Column(Text, nullable=False)
    category = Column(String(100), nullable=False, default="Strategic Positioning")
    rationale = Column(Text, nullable=False, default="")
    is_skipped = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)

    # Relationships
    session = relationship("InterviewSession", back_populates="questions")
    answer = relationship("InterviewAnswer", back_populates="question", uselist=False, cascade="all, delete-orphan")

class InterviewAnswer(Base):
    __tablename__ = "interview_answers"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_id = Column(String(36), ForeignKey("interview_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(String(36), ForeignKey("interview_questions.id", ondelete="CASCADE"), unique=True, nullable=False)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    
    question_number = Column(Integer, nullable=False)
    answer_text = Column(Text, nullable=False)
    extracted_insights = Column(JSON, nullable=False, default=dict)
    created_at = Column(DateTime(timezone=True), default=get_utc_now, nullable=False)

    # Relationships
    session = relationship("InterviewSession", back_populates="answers")
    question = relationship("InterviewQuestion", back_populates="answer")
