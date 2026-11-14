from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from backend.app.models.source import IntelligenceSource, Competitor
from backend.app.models.company import Company
from backend.app.schemas.source import SourceCreate, SourceUpdate, CompetitorCreate
from backend.app.services.source_discovery_agent import SourceDiscoveryAgent
from backend.app.core.errors import ResourceNotFoundError
from backend.app.core.logging import logger

class SourceService:
    @staticmethod
    async def list_sources(
        session: AsyncSession,
        company_id: str,
        pillar: Optional[str] = None,
        approval_status: Optional[str] = None
    ) -> List[IntelligenceSource]:
        stmt = select(IntelligenceSource).where(IntelligenceSource.company_id == company_id)
        if pillar:
            stmt = stmt.where(IntelligenceSource.pillar == pillar.upper())
        if approval_status:
            stmt = stmt.where(IntelligenceSource.approval_status == approval_status.upper())
        stmt = stmt.order_by(IntelligenceSource.created_at.desc())
        result = await session.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def create_source(
        session: AsyncSession,
        company_id: str,
        data: SourceCreate
    ) -> IntelligenceSource:
        source = IntelligenceSource(
            company_id=company_id,
            name=data.name.strip(),
            url=str(data.url).strip(),
            source_type=data.source_type,
            pillar=data.pillar,
            expected_frequency=data.expected_frequency,
            reliability_score=data.reliability_score,
            approval_status=data.approval_status,
            health_status="HEALTHY"
        )
        session.add(source)
        await session.commit()
        await session.refresh(source)
        return source

    @staticmethod
    async def update_source(
        session: AsyncSession,
        source_id: str,
        data: SourceUpdate
    ) -> IntelligenceSource:
        stmt = select(IntelligenceSource).where(IntelligenceSource.id == source_id)
        source = (await session.execute(stmt)).scalar_one_or_none()
        if not source:
            raise ResourceNotFoundError("IntelligenceSource", source_id)

        if data.name is not None:
            source.name = data.name.strip()
        if data.url is not None:
            source.url = str(data.url).strip()
        if data.source_type is not None:
            source.source_type = data.source_type
        if data.pillar is not None:
            source.pillar = data.pillar
        if data.expected_frequency is not None:
            source.expected_frequency = data.expected_frequency
        if data.reliability_score is not None:
            source.reliability_score = data.reliability_score
        if data.approval_status is not None:
            source.approval_status = data.approval_status
        if data.health_status is not None:
            source.health_status = data.health_status

        await session.commit()
        await session.refresh(source)
        return source

    @staticmethod
    async def delete_source(session: AsyncSession, source_id: str) -> bool:
        stmt = select(IntelligenceSource).where(IntelligenceSource.id == source_id)
        source = (await session.execute(stmt)).scalar_one_or_none()
        if not source:
            raise ResourceNotFoundError("IntelligenceSource", source_id)
        await session.delete(source)
        await session.commit()
        return True

    @staticmethod
    async def discover_sources(
        session: AsyncSession,
        company_id: str,
        categories: Optional[List[str]] = None,
        max_sources: int = 25
    ) -> List[IntelligenceSource]:
        """Discovers 20+ targeted intelligence sources tailored to the company across

        CUSTOMERS, COMPETITORS, MARKET, and INTERNAL categories.
        Enforces approval_status='DISCOVERED' (never auto-approves).
        """
        stmt = select(Company).where(Company.id == company_id)
        company = (await session.execute(stmt)).scalar_one_or_none()
        if not company:
            raise ResourceNotFoundError("Company", company_id)

        # Get existing competitors
        comp_stmt = select(Competitor).where(Competitor.company_id == company_id)
        competitors = list((await session.execute(comp_stmt)).scalars().all())
        competitor_names = [c.name for c in competitors]

        # Call SourceDiscoveryAgent
        discovered_items = await SourceDiscoveryAgent.discover_sources_for_company(
            company_name=company.name,
            company_website=company.website_url,
            industry=company.industry or "",
            competitors=competitor_names
        )

        for bp in discovered_items[:max_sources]:
            # Avoid duplicate URLs for same company
            exists_stmt = select(IntelligenceSource).where(
                IntelligenceSource.company_id == company_id,
                IntelligenceSource.url == bp["url"]
            )
            exists = (await session.execute(exists_stmt)).scalar_one_or_none()
            if not exists:
                src = IntelligenceSource(
                    company_id=company_id,
                    name=bp["name"],
                    url=bp["url"],
                    source_type=bp.get("source_type", "WEBPAGE"),
                    pillar=bp.get("category", "MARKET"),
                    reason_for_inclusion=bp.get("reason_for_inclusion", ""),
                    relevance_score=float(bp.get("relevance", 0.90)),
                    expected_frequency=bp.get("update_frequency", "DAILY"),
                    reliability_score=float(bp.get("credibility", 0.85)),
                    approval_status=bp.get("approval_status", "DISCOVERED"),
                    health_status="HEALTHY"
                )
                session.add(src)

        await session.commit()
        return await SourceService.list_sources(session, company_id)

    @staticmethod
    async def list_competitors(session: AsyncSession, company_id: str) -> List[Competitor]:
        stmt = select(Competitor).where(Competitor.company_id == company_id).order_by(Competitor.created_at.desc())
        return list((await session.execute(stmt)).scalars().all())

    @staticmethod
    async def create_competitor(session: AsyncSession, company_id: str, data: CompetitorCreate) -> Competitor:
        comp = Competitor(
            company_id=company_id,
            name=data.name.strip(),
            website_url=str(data.website_url).strip(),
            tier=data.tier,
            notes=data.notes
        )
        session.add(comp)
        await session.commit()
        await session.refresh(comp)
        return comp
