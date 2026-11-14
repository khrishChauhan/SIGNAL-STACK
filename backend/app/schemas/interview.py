from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime

class InterviewStartRequest(BaseModel):
    restart: bool = False

class InterviewQuestionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    session_id: str
    question_number: int
    question_text: str
    category: str
    rationale: str
    is_skipped: bool = False
    created_at: datetime

class InterviewAnswerRequest(BaseModel):
    answer_text: str = Field(..., min_length=2, description="Founder's strategic response")

class InterviewSkipRequest(BaseModel):
    reason: Optional[str] = Field("Skipped by founder", max_length=255)

class InterviewAnswerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    session_id: str
    question_id: str
    question_number: int
    answer_text: str
    extracted_insights: Dict[str, Any] = {}
    created_at: datetime

class InterviewSessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    company_id: str
    status: str
    current_question_number: int
    total_questions: int
    strategic_priorities: Dict[str, Any] = {}
    started_at: datetime
    completed_at: Optional[datetime] = None
    current_question: Optional[InterviewQuestionResponse] = None
    questions: List[InterviewQuestionResponse] = []
    answers: List[InterviewAnswerResponse] = []

class InterviewProfileUpdateRequest(BaseModel):
    strategic_priorities: Dict[str, Any] = Field(..., description="Updated strategic priority weights and notes")
