from typing import Optional, List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from backend.app.models.company import Company, CompanyProfile
from backend.app.schemas.company import CompanyCreate, CompanyUpdate
from backend.app.core.errors import CompanyNotFoundError

class CompanyService:
    @staticmethod
    async def create_company(session: AsyncSession, data: CompanyCreate) -> Company:
        company = Company(
            name=data.name.strip(),
            website_url=str(data.website_url).strip(),
            industry=data.industry.strip() if data.industry else None,
            geography=data.geography.strip() if data.geography else None,
            onboarding_status="REGISTERED"
        )
        session.add(company)
        await session.flush()

        # Initialize blank profile
        profile = CompanyProfile(
            company_id=company.id,
            executive_summary=f"Profile initialized for {company.name}. Research pending.",
            value_proposition="",
            target_customer_profile="",
            business_model="Pending Research",
            core_strengths=[],
            known_weaknesses=[],
            raw_research_data={}
        )
        session.add(profile)
        await session.commit()
        
        # Reload with eager loaded profile
        stmt = select(Company).where(Company.id == company.id).options(selectinload(Company.profile))
        company = (await session.execute(stmt)).scalar_one()
        return company

    @staticmethod
    async def get_company(session: AsyncSession, company_id: str) -> Company:
        stmt = (
            select(Company)
            .where(Company.id == company_id)
            .options(selectinload(Company.profile))
        )
        result = await session.execute(stmt)
        company = result.scalar_one_or_none()
        if not company:
            raise CompanyNotFoundError(company_id)
        return company

    @staticmethod
    async def list_companies(
        session: AsyncSession,
        page: int = 1,
        limit: int = 20
    ) -> Tuple[List[Company], int]:
        count_stmt = select(func.count(Company.id))
        total = (await session.execute(count_stmt)).scalar() or 0

        offset = (page - 1) * limit
        stmt = (
            select(Company)
            .options(selectinload(Company.profile))
            .order_by(Company.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        result = await session.execute(stmt)
        companies = list(result.scalars().all())
        return companies, total

    @staticmethod
    async def update_company(
        session: AsyncSession,
        company_id: str,
        data: CompanyUpdate
    ) -> Company:
        company = await CompanyService.get_company(session, company_id)
        if data.name is not None:
            company.name = data.name.strip()
        if data.website_url is not None:
            company.website_url = str(data.website_url).strip()
        if data.industry is not None:
            company.industry = data.industry.strip()
        if data.geography is not None:
            company.geography = data.geography.strip()
        if data.onboarding_status is not None:
            company.onboarding_status = data.onboarding_status

        await session.commit()
        stmt = select(Company).where(Company.id == company.id).options(selectinload(Company.profile))
        return (await session.execute(stmt)).scalar_one()

    @staticmethod
    async def get_company_profile(session: AsyncSession, company_id: str) -> CompanyProfile:
        stmt = select(CompanyProfile).where(CompanyProfile.company_id == company_id)
        result = await session.execute(stmt)
        profile = result.scalar_one_or_none()
        if not profile:
            raise CompanyNotFoundError(company_id)
        return profile
