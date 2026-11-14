from typing import List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.db.session import get_db
from backend.app.services.brief_service import BriefService
from backend.app.schemas.brief import BriefResponse, BriefGenerateRequest
from backend.app.schemas.common import APIResponse

router = APIRouter(tags=["Monday Morning Briefs"])

@router.post("/companies/{id}/briefs/generate", response_model=APIResponse[BriefResponse], status_code=status.HTTP_201_CREATED)
async def generate_monday_morning_brief(
    id: str,
    body: BriefGenerateRequest = BriefGenerateRequest(),
    session: AsyncSession = Depends(get_db)
):
    """Synthesizes the comprehensive Monday Morning Intelligence Brief using ranked signals and RAG."""
    brief = await BriefService.generate_brief(
        session,
        id,
        week_identifier=body.week_identifier,
        force_refresh=body.force_refresh
    )
    return APIResponse(
        data=brief,
        message=f"Monday Morning Brief '{brief.title}' generated successfully."
    )

@router.get("/companies/{id}/briefs", response_model=APIResponse[List[BriefResponse]])
async def list_company_briefs(
    id: str,
    session: AsyncSession = Depends(get_db)
):
    """Fetches historical archive of past weekly briefs."""
    briefs = await BriefService.list_briefs(session, id)
    return APIResponse(data=briefs)

@router.get("/briefs/{id}", response_model=APIResponse[BriefResponse])
async def get_brief_details(
    id: str,
    session: AsyncSession = Depends(get_db)
):
    """Retrieves full briefing payload including strategic alert, movements, RAG alignment, and action items."""
    brief = await BriefService.get_brief(session, id)
    return APIResponse(data=brief)
