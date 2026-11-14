from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from backend.app.models.company import Company
from backend.app.models.signal import IntelligenceSignal
from backend.app.models.document import InternalDocument
from backend.app.models.brief import IntelligenceBrief, BriefAction
from backend.app.services.rag_engine import RAGEngine
from backend.app.services.ai.factory import get_ai_service
from backend.app.core.errors import ResourceNotFoundError
from backend.app.core.logging import logger

class BriefService:
    @staticmethod
    async def generate_brief(
        session: AsyncSession,
        company_id: str,
        week_identifier: Optional[str] = None,
        force_refresh: bool = False
    ) -> IntelligenceBrief:
        # Check company existence
        stmt = select(Company).where(Company.id == company_id)
        company = (await session.execute(stmt)).scalar_one_or_none()
        if not company:
            raise ResourceNotFoundError("Company", company_id)

        # Default week identifier to current ISO calendar week
        now = datetime.now(timezone.utc)
        iso_year, iso_week, _ = now.isocalendar()
        current_week = week_identifier or f"{iso_year}-W{iso_week:02d}"

        # If already exists and not forced, return existing
        if not force_refresh:
            exist_stmt = (
                select(IntelligenceBrief)
                .where(
                    IntelligenceBrief.company_id == company_id,
                    IntelligenceBrief.brief_week == current_week
                )
                .options(selectinload(IntelligenceBrief.actions))
            )
            existing = (await session.execute(exist_stmt)).scalar_one_or_none()
            if existing:
                return existing

        # Fetch top 10 ranked signals
        sig_stmt = (
            select(IntelligenceSignal)
            .where(
                IntelligenceSignal.company_id == company_id,
                IntelligenceSignal.is_archived == False
            )
            .options(selectinload(IntelligenceSignal.evidences))
            .order_by(IntelligenceSignal.ranking_score.desc())
            .limit(10)
        )
        signals = list((await session.execute(sig_stmt)).scalars().all())

        # Fetch uploaded internal documents and semantic RAG chunks
        doc_stmt = (
            select(InternalDocument)
            .where(InternalDocument.company_id == company_id)
            .order_by(InternalDocument.uploaded_at.desc())
            .limit(5)
        )
        internal_docs = list((await session.execute(doc_stmt)).scalars().all())
        internal_context = "\n".join([f"- {d.filename} ({d.file_type}): {d.summary or 'Strategy document'}" for d in internal_docs]) or "No internal strategy files uploaded."

        # RAG semantic retrieval from ChromaDB
        rag_query = f"Strategic focus, competition, threats, opportunities, and internal metrics for {company.name}"
        rag_chunks = RAGEngine.retrieve_relevant_chunks(company_id=company_id, query=rag_query, top_k=6)
        if rag_chunks:
            rag_evidence_text = "\n".join([
                f"[Source: {c.get('title', 'Doc')} | Sim: {c.get('similarity_score', 0.8)}]: {c.get('chunk_text', '')}"
                for c in rag_chunks
            ])
            rag_section = f"\nSemantic Vector Retrieval (RAG Grounding):\n{rag_evidence_text}\n"
        else:
            rag_section = ""

        signals_context = "\n".join([
            f"Signal {s.id} [{s.pillar} - {s.urgency}]: {s.title}\nFact: {s.verified_fact}\nImpact: {s.ai_interpretation}\nScore: {s.ranking_score}"
            for s in signals
        ]) or "No active external signals crawled yet."

        ai_service = get_ai_service()
        prompt = f"""
You are the Chief Intelligence Officer preparing the Monday Morning Intelligence Brief for {company.name}.
Week: {current_week}
Company Domain: {company.website_url}
Ranked External Intelligence Signals:
{signals_context}

Internal Strategy Documents:
{internal_context}
{rag_section}
Synthesize a comprehensive, evidence-grounded briefing.
STRICT RULE: Separate verified facts from strategic implications. Cross-reference internal strategy where relevant.
Return JSON matching this structure:
{{
  "title": "Monday Morning Intelligence Brief — {company.name}",
  "executive_tldr": [
    "High impact strategic bullet 1",
    "High impact strategic bullet 2",
    "High impact strategic bullet 3"
  ],
  "strategic_alert": {{
    "headline": "Highest urgency threat or golden opportunity",
    "verified_fact": "Evidence directly extracted from monitored source",
    "ai_interpretation": "Strategic deduction for executive leadership",
    "recommended_action": "Immediate tactical decision required this week"
  }},
  "competitor_movements": [
    {{"competitor": "Rival name", "observation": "Fact verified", "strategic_impact": "Impact assessment"}}
  ],
  "market_shifts": [
    {{"shift": "Industry/regulatory change", "evidence": "Citation", "implication": "Business impact"}}
  ],
  "customer_voice": [
    {{"sentiment": "User pain point or review signal", "source": "Customer feed"}}
  ],
  "internal_alignment": [
    {{"internal_doc": "Filename", "strategic_relevance": "How external signals validate or challenge internal roadmap"}}
  ],
  "actions": [
    {{"priority": "P0", "action": "Urgent decision description", "owner": "Executive Role", "deadline": "By Wednesday"}},
    {{"priority": "P1", "action": "Tactical initiative", "owner": "Department Lead", "deadline": "By Friday"}},
    {{"priority": "P2", "action": "Monitoring task", "owner": "Strategy Team", "deadline": "Next 14 Days"}}
  ]
}}
"""
        try:
            brief_data = await ai_service.generate_json(prompt)
        except Exception:
            fallback = get_ai_service(force_fallback=True)
            brief_data = await fallback.generate_json(prompt)

        brief = IntelligenceBrief(
            company_id=company_id,
            brief_week=current_week,
            title=brief_data.get("title", f"Monday Morning Intelligence Brief — {company.name}"),
            executive_tldr=brief_data.get("executive_tldr", [f"Executive briefing compiled for {current_week}."]),
            strategic_alert=brief_data.get("strategic_alert", {}),
            competitor_movements=brief_data.get("competitor_movements", []),
            market_shifts=brief_data.get("market_shifts", []),
            customer_voice=brief_data.get("customer_voice", []),
            internal_alignment=brief_data.get("internal_alignment", []),
            cited_signal_ids=[s.id for s in signals],
            status="PUBLISHED",
            generated_at=datetime.now(timezone.utc)
        )
        session.add(brief)
        await session.flush()

        # Add Action Items
        actions_data = brief_data.get("actions", [
            {"priority": "P1", "action": f"Review {current_week} strategic developments with team", "owner": "Founder", "deadline": "Friday"}
        ])
        for act in actions_data:
            action_item = BriefAction(
                brief_id=brief.id,
                company_id=company_id,
                priority=act.get("priority", "P1"),
                action_text=act.get("action", "Review briefing"),
                owner=act.get("owner", "Leadership"),
                deadline=act.get("deadline", "End of Week"),
                status="PENDING"
            )
            session.add(action_item)

        await session.commit()
        return await BriefService.get_brief(session, brief.id)

    @staticmethod
    async def list_briefs(session: AsyncSession, company_id: str) -> List[IntelligenceBrief]:
        stmt = (
            select(IntelligenceBrief)
            .where(IntelligenceBrief.company_id == company_id)
            .options(selectinload(IntelligenceBrief.actions))
            .order_by(IntelligenceBrief.generated_at.desc())
        )
        return list((await session.execute(stmt)).scalars().all())

    @staticmethod
    async def get_brief(session: AsyncSession, brief_id: str) -> IntelligenceBrief:
        stmt = (
            select(IntelligenceBrief)
            .where(IntelligenceBrief.id == brief_id)
            .options(selectinload(IntelligenceBrief.actions))
        )
        brief = (await session.execute(stmt)).scalar_one_or_none()
        if not brief:
            raise ResourceNotFoundError("IntelligenceBrief", brief_id)
        return brief
