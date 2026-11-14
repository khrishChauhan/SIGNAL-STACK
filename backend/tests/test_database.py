import pytest
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.models.company import Company, CompanyProfile
from backend.app.models.source import IntelligenceSource, Competitor
from backend.app.models.interview import InterviewSession, InterviewQuestion

@pytest.mark.asyncio
async def test_database_crud_operations(db_session: AsyncSession):
    # 1. Create Company
    company = Company(
        name="MeetUniversity Test",
        website_url="https://www.meetuniversity.com",
        industry="EdTech",
        geography="India"
    )
    db_session.add(company)
    await db_session.commit()
    await db_session.refresh(company)

    assert company.id is not None
    assert company.onboarding_status == "REGISTERED"

    # 2. Add Company Profile
    profile = CompanyProfile(
        company_id=company.id,
        executive_summary="International student recruitment platform",
        value_proposition="Direct university matching",
        business_model="Marketplace",
        target_customer_profile="Indian undergraduates"
    )
    db_session.add(profile)
    await db_session.commit()

    # 3. Add Sources & Competitors
    source = IntelligenceSource(
        company_id=company.id,
        name="THE RSS Feed",
        url="https://www.timeshighereducation.com/rss.xml",
        source_type="RSS",
        pillar="MARKET"
    )
    competitor = Competitor(
        company_id=company.id,
        name="LeapScholar",
        website_url="https://leapscholar.com",
        tier="DIRECT"
    )
    db_session.add_all([source, competitor])
    await db_session.commit()

    # 4. Verify Queries
    sources_stmt = select(IntelligenceSource).where(IntelligenceSource.company_id == company.id)
    sources = list((await db_session.execute(sources_stmt)).scalars().all())
    assert len(sources) == 1
    assert sources[0].name == "THE RSS Feed"

    # 5. Test Cascade Deletion
    await db_session.delete(company)
    await db_session.commit()

    remaining_sources = list((await db_session.execute(sources_stmt)).scalars().all())
    assert len(remaining_sources) == 0
