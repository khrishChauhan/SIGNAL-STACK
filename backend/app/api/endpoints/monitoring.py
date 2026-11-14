from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.db.session import get_db
from backend.app.services.intelligence_service import IntelligenceService
from backend.app.schemas.crawl import CrawlTriggerRequest, CrawlJobResponse
from backend.app.schemas.common import APIResponse

router = APIRouter(tags=["Monitoring & Web Crawling"])

@router.post("/companies/{id}/crawl", response_model=APIResponse[CrawlJobResponse])
async def trigger_company_crawl(
    id: str,
    body: CrawlTriggerRequest = CrawlTriggerRequest(),
    session: AsyncSession = Depends(get_db)
):
    """Executes real-time crawling and deduplication across approved sources."""
    crawl_job = await IntelligenceService.execute_crawl(
        session,
        id,
        source_ids=body.source_ids,
        force_all_approved=body.force_all_approved
    )
    return APIResponse(
        data=crawl_job,
        message=f"Crawl job completed. Extracted {crawl_job.items_extracted} new unique documents from {crawl_job.items_crawled} items."
    )

@router.get("/companies/{id}/crawl-history", response_model=APIResponse[List[CrawlJobResponse]])
async def get_company_crawl_history(
    id: str,
    session: AsyncSession = Depends(get_db)
):
    """Fetches history of past crawl execution jobs."""
    history = await IntelligenceService.get_crawl_history(session, id)
    return APIResponse(data=history)
