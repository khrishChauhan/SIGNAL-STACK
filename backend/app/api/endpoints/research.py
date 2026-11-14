from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.db.session import get_db
from backend.app.services.research_service import ResearchService
from backend.app.services.company_service import CompanyService
from backend.app.schemas.research import ResearchStatusResponse
from backend.app.schemas.company import CompanyProfileResponse
from backend.app.schemas.common import APIResponse

router = APIRouter(tags=["Research"])

@router.post("/companies/{id}/research", response_model=APIResponse[ResearchStatusResponse])
async def trigger_company_research(
    id: str,
    session: AsyncSession = Depends(get_db)
):
    """Triggers real website crawling, competitor discovery, and AI profile synthesis."""
    research_result = await ResearchService.execute_company_research(session, id)
    return APIResponse(
        data=research_result,
        message="Company research and AI profile synthesis completed successfully."
    )

@router.get("/companies/{id}/research", response_model=APIResponse[CompanyProfileResponse])
async def get_company_research(
    id: str,
    session: AsyncSession = Depends(get_db)
):
    """Retrieves AI-generated research profile for the target company."""
    profile = await CompanyService.get_company_profile(session, id)
    return APIResponse(data=profile)
