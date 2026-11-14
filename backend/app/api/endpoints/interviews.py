from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.db.session import get_db
from backend.app.services.interview_service import InterviewService
from backend.app.schemas.interview import (
    InterviewStartRequest,
    InterviewAnswerRequest,
    InterviewSkipRequest,
    InterviewSessionResponse,
    InterviewProfileUpdateRequest
)
from backend.app.schemas.common import APIResponse

router = APIRouter(tags=["Adaptive Founder Interview"])

@router.post("/companies/{id}/interview/start", response_model=APIResponse[InterviewSessionResponse], status_code=status.HTTP_201_CREATED)
async def start_founder_interview(
    id: str,
    body: InterviewStartRequest = InterviewStartRequest(),
    session: AsyncSession = Depends(get_db)
):
    """Starts or resumes the adaptive 10-question strategic calibration interview."""
    interview_session = await InterviewService.start_session(session, id, restart=body.restart)
    return APIResponse(
        data=interview_session,
        message="Interview session started. Question 1 generated based on company profile."
    )

@router.get("/interviews/{id}", response_model=APIResponse[InterviewSessionResponse])
async def get_interview_session(
    id: str,
    session: AsyncSession = Depends(get_db)
):
    """Fetches interview transcript, current adaptive question, and strategic priority vector."""
    interview_session = await InterviewService.get_session(session, id)
    return APIResponse(data=interview_session)

@router.post("/interviews/{id}/answer", response_model=APIResponse[InterviewSessionResponse])
async def submit_interview_answer(
    id: str,
    body: InterviewAnswerRequest,
    session: AsyncSession = Depends(get_db)
):
    """Submits answer to current question and generates the next adaptive question."""
    interview_session = await InterviewService.submit_answer(session, id, body.answer_text)
    msg = "Answer submitted. Next adaptive question generated." if interview_session.status != "COMPLETED" else "Interview complete! Strategic priority vector synthesized."
    return APIResponse(data=interview_session, message=msg)

@router.post("/interviews/{id}/skip", response_model=APIResponse[InterviewSessionResponse])
async def skip_interview_question(
    id: str,
    body: InterviewSkipRequest = InterviewSkipRequest(),
    session: AsyncSession = Depends(get_db)
):
    """Skips current interview question and advances to the next question."""
    interview_session = await InterviewService.skip_question(session, id, reason=body.reason or "Skipped")
    return APIResponse(data=interview_session, message="Question skipped.")

@router.put("/interviews/{id}/profile", response_model=APIResponse[InterviewSessionResponse])
async def update_interview_profile(
    id: str,
    body: InterviewProfileUpdateRequest,
    session: AsyncSession = Depends(get_db)
):
    """Updates strategic priority weights resulting from calibration."""
    interview_session = await InterviewService.update_profile(session, id, body.strategic_priorities)
    return APIResponse(data=interview_session, message="Strategic priorities updated.")
