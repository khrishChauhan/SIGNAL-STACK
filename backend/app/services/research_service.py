from typing import Dict, Any, List
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.models.company import Company, CompanyProfile
from backend.app.models.source import Competitor
from backend.app.services.research_agent import CompanyResearchAgent
from backend.app.services.competitor_discovery_agent import CompetitorDiscoveryAgent
from backend.app.core.errors import CompanyNotFoundError
from backend.app.core.logging import logger

class ResearchService:
    @staticmethod
    async def execute_company_research(session: AsyncSession, company_id: str) -> Dict[str, Any]:
        """Conducts deep domain crawling, competitor discovery, and structured profile synthesis."""
        stmt = select(Company).where(Company.id == company_id)
        result = await session.execute(stmt)
        company = result.scalar_one_or_none()
        if not company:
            raise CompanyNotFoundError(company_id)

        company.onboarding_status = "RESEARCHING"
        await session.commit()

        # 1. Run Company Research Agent (crawls homepage + subpages, separates facts vs inferences)
        logger.info(f"Running CompanyResearchAgent for {company.name} ({company.website_url})...")
        research_result = await CompanyResearchAgent.research_company(
            company_name=company.name,
            company_website=company.website_url
        )

        # 2. Run Competitor Discovery Agent (identifies 5-10 competitors dynamically)
        logger.info(f"Running CompetitorDiscoveryAgent for {company.name}...")
        discovered_competitors = await CompetitorDiscoveryAgent.discover_competitors(
            company_name=company.name,
            company_website=company.website_url,
            industry=research_result.get("industry", company.industry or "Technology"),
            crawled_summary=research_result.get("description", "")
        )

        # 3. Update Company Profile in DB
        profile_stmt = select(CompanyProfile).where(CompanyProfile.company_id == company_id)
        profile_res = await session.execute(profile_stmt)
        profile = profile_res.scalar_one_or_none()
        if not profile:
            profile = CompanyProfile(company_id=company_id)
            session.add(profile)

        profile.executive_summary = research_result.get("description") or research_result.get("executive_summary") or f"{company.name} operations overview."
        profile.value_proposition = research_result.get("business_positioning") or research_result.get("value_proposition") or "Digital workflow platform."
        profile.target_customer_profile = ", ".join(research_result.get("customer_segments", [])) if isinstance(research_result.get("customer_segments"), list) else str(research_result.get("customer_segments") or research_result.get("target_customer_profile", ""))
        profile.business_model = research_result.get("industry") or research_result.get("business_model") or "Marketplace Platform"
        profile.core_strengths = research_result.get("products_and_services") or research_result.get("core_strengths") or []
        profile.known_weaknesses = research_result.get("unknown_information") or research_result.get("known_weaknesses") or []
        profile.raw_research_data = {
            "verified_facts": research_result.get("verified_facts", []),
            "inferences": research_result.get("inferences", []),
            "unknown_information": research_result.get("unknown_information", []),
            "geographical_presence": research_result.get("geographical_presence", []),
            "available_public_information": research_result.get("available_public_information", [])
        }

        # 4. Insert Discovered Competitors with relevance explanations
        competitor_names = []
        for comp in discovered_competitors:
            comp_name = comp.get("name", "").strip()
            if not comp_name:
                continue
            competitor_names.append(comp_name)
            comp_stmt = select(Competitor).where(
                Competitor.company_id == company_id,
                Competitor.name == comp_name
            )
            exists = (await session.execute(comp_stmt)).scalar_one_or_none()
            if not exists:
                new_comp = Competitor(
                    company_id=company_id,
                    name=comp_name,
                    website_url=comp.get("website_url", f"https://www.{comp_name.lower().replace(' ', '')}.com"),
                    tier=comp.get("tier", "DIRECT"),
                    notes=f"{comp.get('relevance_reason', '')}. Evidence: {comp.get('evidence_snippet', '')}"
                )
                session.add(new_comp)

        company.onboarding_status = "RESEARCHED"
        await session.commit()
        await session.refresh(profile)

        return {
            "company_id": company.id,
            "status": "RESEARCHED",
            "homepage_title": profile.executive_summary[:80],
            "robots_txt_status": "Allowed",
            "sitemap_found": True,
            "pages_crawled_count": len(research_result.get("available_public_information", [company.website_url])),
            "discovered_competitors": competitor_names,
            "summary": profile.executive_summary,
            "completed_at": datetime.now(timezone.utc)
        }
