from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.db.session import get_db
from backend.app.services.source_service import SourceService
from backend.app.schemas.source import (
    SourceCreate,
    SourceUpdate,
    SourceResponse,
    SourceDiscoverRequest,
    CompetitorCreate,
    CompetitorResponse
)
from backend.app.schemas.common import APIResponse

router = APIRouter(tags=["Intelligence Sources & Competitors"])

@router.get("/companies/{id}/sources", response_model=APIResponse[List[SourceResponse]])
async def list_company_sources(
    id: str,
    pillar: Optional[str] = Query(None, description="CUSTOMER, COMPETITOR, or MARKET"),
    approval_status: Optional[str] = Query(None, description="DISCOVERED, APPROVED, REJECTED, CUSTOM"),
    session: AsyncSession = Depends(get_db)
):
    """Lists all intelligence sources in the company's Signal Stack."""
    sources = await SourceService.list_sources(session, id, pillar=pillar, approval_status=approval_status)
    return APIResponse(data=sources)

@router.post("/companies/{id}/sources", response_model=APIResponse[SourceResponse], status_code=status.HTTP_201_CREATED)
async def create_custom_source(
    id: str,
    body: SourceCreate,
    session: AsyncSession = Depends(get_db)
):
    """Adds a custom RSS feed or URL source to the company's stack."""
    source = await SourceService.create_source(session, id, body)
    return APIResponse(data=source, message="Custom intelligence source added successfully.")

@router.put("/sources/{id}", response_model=APIResponse[SourceResponse])
async def update_source(
    id: str,
    body: SourceUpdate,
    session: AsyncSession = Depends(get_db)
):
    """Updates approval status, frequency, or health parameters of a source."""
    source = await SourceService.update_source(session, id, body)
    return APIResponse(data=source, message="Source updated successfully.")

@router.delete("/sources/{id}", response_model=APIResponse[bool])
async def delete_source(
    id: str,
    session: AsyncSession = Depends(get_db)
):
    """Deletes an intelligence source from the stack."""
    await SourceService.delete_source(session, id)
    return APIResponse(data=True, message="Source deleted successfully.")

@router.post("/companies/{id}/sources/discover", response_model=APIResponse[List[SourceResponse]])
async def discover_intelligence_sources(
    id: str,
    body: SourceDiscoverRequest = SourceDiscoverRequest(),
    session: AsyncSession = Depends(get_db)
):
    """Automatically discovers 15-30 curated sources across Competitors, Customers, and Market."""
    sources = await SourceService.discover_sources(
        session,
        id,
        categories=body.categories,
        max_sources=body.max_sources
    )
    return APIResponse(data=sources, message=f"Discovered and approved {len(sources)} intelligence sources.")

@router.get("/companies/{id}/competitors", response_model=APIResponse[List[CompetitorResponse]])
async def list_company_competitors(
    id: str,
    session: AsyncSession = Depends(get_db)
):
    """Lists tracked competitors for the target company."""
    competitors = await SourceService.list_competitors(session, id)
    return APIResponse(data=competitors)

@router.post("/companies/{id}/competitors", response_model=APIResponse[CompetitorResponse], status_code=status.HTTP_201_CREATED)
async def create_company_competitor(
    id: str,
    body: CompetitorCreate,
    session: AsyncSession = Depends(get_db)
):
    """Adds a competitor to monitor."""
    competitor = await SourceService.create_competitor(session, id, body)
    return APIResponse(data=competitor, message="Competitor added successfully.")
