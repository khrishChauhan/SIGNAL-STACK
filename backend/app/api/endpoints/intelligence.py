from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.db.session import get_db
from backend.app.services.intelligence_service import IntelligenceService
from backend.app.schemas.signal import SignalResponse, SignalDetailResponse, SignalAnalyseRequest
from backend.app.schemas.common import APIResponse, PaginatedResponse, PaginationMeta

router = APIRouter(tags=["Intelligence & Signals"])

@router.get("/companies/{id}/signals", response_model=PaginatedResponse[SignalResponse])
async def list_company_signals(
    id: str,
    pillar: Optional[str] = Query(None, description="CUSTOMER, COMPETITOR, or MARKET"),
    urgency: Optional[str] = Query(None, description="LOW, MEDIUM, HIGH, or CRITICAL"),
    min_score: Optional[float] = Query(None, ge=0.0, le=100.0),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    session: AsyncSession = Depends(get_db)
):
    """Lists ranked, evidence-backed intelligence signals with multi-pillar filtering."""
    signals, total = await IntelligenceService.list_signals(
        session,
        id,
        pillar=pillar,
        urgency=urgency,
        min_score=min_score,
        page=page,
        limit=limit
    )
    total_pages = max(1, (total + limit - 1) // limit)
    return PaginatedResponse(
        data=signals,
        pagination=PaginationMeta(total=total, page=page, limit=limit, total_pages=total_pages)
    )

@router.get("/signals/{id}", response_model=APIResponse[SignalDetailResponse])
async def get_signal_details(
    id: str,
    session: AsyncSession = Depends(get_db)
):
    """Retrieves full atomic intelligence record with traceable quotes and source URLs."""
    signal = await IntelligenceService.get_signal(session, id)
    return APIResponse(data=signal)

@router.post("/companies/{id}/analyse", response_model=APIResponse[List[SignalResponse]])
async def trigger_intelligence_analysis(
    id: str,
    body: SignalAnalyseRequest = SignalAnalyseRequest(),
    session: AsyncSession = Depends(get_db)
):
    """Analyzes raw crawled documents, extracts verified facts, infers implications, and scores signals."""
    signals = await IntelligenceService.analyse_crawled_content(
        session,
        id,
        min_confidence=body.min_confidence,
        limit_documents=body.limit_documents
    )
    return APIResponse(
        data=signals,
        message=f"Intelligence analysis completed. Produced {len(signals)} new evidence-backed signals."
    )
