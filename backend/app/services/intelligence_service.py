from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from backend.app.models.source import IntelligenceSource
from backend.app.models.crawl import CrawlJob, CrawledDocument
from backend.app.models.signal import IntelligenceSignal, SignalEvidence
from backend.app.services.crawling_engine import WebCrawlingEngine
from backend.app.services.intelligence_analysis_agent import IntelligenceAnalysisAgent
from backend.app.core.errors import ResourceNotFoundError
from backend.app.core.logging import logger

class IntelligenceService:
    @staticmethod
    async def execute_crawl(
        session: AsyncSession,
        company_id: str,
        source_ids: Optional[List[str]] = None,
        force_all_approved: bool = True
    ) -> CrawlJob:
        """Executes real crawling across approved company intelligence sources

        using WebCrawlingEngine with rate limiting, robots.txt compliance,
        content revision detection, and honest failure tracking.
        """
        return await WebCrawlingEngine.run_crawl_cycle(
            session=session,
            company_id=company_id,
            source_ids=source_ids,
            force_all_approved=force_all_approved
        )

    @staticmethod
    async def get_crawl_history(session: AsyncSession, company_id: str) -> List[CrawlJob]:
        stmt = (
            select(CrawlJob)
            .where(CrawlJob.company_id == company_id)
            .order_by(CrawlJob.created_at.desc())
        )
        return list((await session.execute(stmt)).scalars().all())

    @staticmethod
    async def analyse_crawled_content(
        session: AsyncSession,
        company_id: str,
        min_confidence: float = 0.65,
        limit_documents: int = 20
    ) -> List[IntelligenceSignal]:
        """Analyzes crawled documents and extracts evidence-backed intelligence signals

        using IntelligenceAnalysisAgent with transparent multi-factor ranking.
        """
        return await IntelligenceAnalysisAgent.process_company_documents(
            session=session,
            company_id=company_id,
            limit_documents=limit_documents,
            min_confidence=min_confidence
        )

    @staticmethod
    async def list_signals(
        session: AsyncSession,
        company_id: str,
        pillar: Optional[str] = None,
        urgency: Optional[str] = None,
        min_score: Optional[float] = None,
        page: int = 1,
        limit: int = 20
    ) -> Tuple[List[IntelligenceSignal], int]:
        stmt = select(IntelligenceSignal).where(
            IntelligenceSignal.company_id == company_id,
            IntelligenceSignal.is_archived == False
        )
        if pillar:
            stmt = stmt.where(IntelligenceSignal.pillar == pillar.upper())
        if urgency:
            stmt = stmt.where(IntelligenceSignal.urgency == urgency.upper())
        if min_score is not None:
            stmt = stmt.where(IntelligenceSignal.ranking_score >= min_score)

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await session.execute(count_stmt)).scalar() or 0

        offset = (page - 1) * limit
        stmt = (
            stmt.options(selectinload(IntelligenceSignal.evidences))
            .order_by(IntelligenceSignal.ranking_score.desc(), IntelligenceSignal.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        signals = list((await session.execute(stmt)).scalars().all())
        return signals, total

    @staticmethod
    async def get_signal(session: AsyncSession, signal_id: str) -> IntelligenceSignal:
        stmt = (
            select(IntelligenceSignal)
            .where(IntelligenceSignal.id == signal_id)
            .options(selectinload(IntelligenceSignal.evidences))
        )
        signal = (await session.execute(stmt)).scalar_one_or_none()
        if not signal:
            raise ResourceNotFoundError("IntelligenceSignal", signal_id)
        return signal
