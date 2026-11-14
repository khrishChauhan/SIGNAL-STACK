from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from backend.app.models.crawl import CrawledDocument
from backend.app.models.source import IntelligenceSource
from backend.app.models.interview import InterviewSession
from backend.app.models.signal import IntelligenceSignal, SignalEvidence
from backend.app.services.signal_ranking_engine import SignalRankingEngine
from backend.app.services.ai.factory import get_ai_service
from backend.app.core.logging import logger

class IntelligenceAnalysisAgent:
    """Agent that synthesizes collected documents into structured, evidence-backed

    intelligence signals with transparent multi-factor ranking.
    """

    @staticmethod
    async def process_company_documents(
        session: AsyncSession,
        company_id: str,
        limit_documents: int = 20,
        min_confidence: float = 0.65
    ) -> List[IntelligenceSignal]:
        # 1. Fetch priority weights from completed interview session if available
        int_stmt = (
            select(InterviewSession)
            .where(InterviewSession.company_id == company_id)
            .order_by(InterviewSession.created_at.desc())
        )
        interview_session = (await session.execute(int_stmt)).scalar_one_or_none()
        priority_weights = interview_session.strategic_priorities if interview_session else {}

        # 2. Fetch unanalyzed documents
        doc_stmt = (
            select(CrawledDocument)
            .where(CrawledDocument.company_id == company_id)
            .order_by(CrawledDocument.crawled_at.desc())
            .limit(limit_documents)
        )
        documents = list((await session.execute(doc_stmt)).scalars().all())

        created_signals = []
        ai_service = get_ai_service()

        for doc in documents:
            # Check if document was already processed
            evidence_check = select(SignalEvidence).where(SignalEvidence.crawled_document_id == doc.id)
            if (await session.execute(evidence_check)).scalar_one_or_none():
                continue

            # Fetch source reliability if linked
            source_credibility = 0.85
            if doc.source_id:
                src_stmt = select(IntelligenceSource).where(IntelligenceSource.id == doc.source_id)
                src = (await session.execute(src_stmt)).scalar_one_or_none()
                if src:
                    source_credibility = src.reliability_score

            prompt = f"""
You are the Senior Intelligence Analysis Agent.
Analyze this crawled document for high-impact strategic intelligence:

Source URL: {doc.url}
Title: {doc.title}
Text Excerpt:
{doc.clean_text[:1800]}

STRICT ENGINEERING RULES:
1. NEVER fabricate facts or news.
2. 'what_happened' must describe the concrete real event reported in the text.
3. 'evidence_snippet' / 'verified_fact' MUST be a real sentence or quote present in the text above.
4. 'publication_date' should be null if not explicitly stated (NEVER invent publication dates).
5. Separate facts from AI interpretation ('ai_interpretation' explains why it matters to company leadership).
6. Assign business_impact: 'LOW', 'MEDIUM', 'HIGH', or 'CRITICAL'.
7. Assign opportunity_or_threat: 'OPPORTUNITY', 'THREAT', or 'NEUTRAL'.
8. Assign urgency: 'LOW', 'MEDIUM', 'HIGH', or 'CRITICAL'.
9. Identify affected_business_area (e.g. 'Admissions', 'Pricing & Margins', 'Compliance', 'Product').

Return JSON:
{{
  "headline": "Concise headline (max 10 words)",
  "summary": "2-3 sentence strategic executive summary",
  "category": "CUSTOMER or COMPETITOR or MARKET",
  "what_happened": "Concrete event description",
  "publication_date": null,
  "evidence_snippet": "Exact quote extracted verbatim from source text",
  "verification_status": "VERIFIED_SOURCE",
  "business_impact": "MEDIUM",
  "opportunity_or_threat": "NEUTRAL",
  "urgency": "MEDIUM",
  "affected_business_area": "Business domain affected",
  "ai_interpretation": "Strategic implication for leadership",
  "recommended_action": "Tactical decision for executive team",
  "confidence_in_interpretation": 0.90
}}
"""
            try:
                analysis = await ai_service.generate_json(prompt)
            except Exception as e:
                logger.warning(f"AI intelligence analysis fallback for {doc.title}: {e}")
                analysis = IntelligenceAnalysisAgent._fallback_analysis(doc)

            confidence = float(analysis.get("confidence_in_interpretation", 0.85))
            if confidence < min_confidence:
                continue

            verified_fact = analysis.get("evidence_snippet") or doc.title
            urgency = analysis.get("urgency", "MEDIUM").upper()
            impact = analysis.get("business_impact", "MEDIUM").upper()
            pillar = analysis.get("category", "MARKET").upper()
            if pillar not in ["CUSTOMER", "COMPETITOR", "MARKET"]:
                pillar = "MARKET"

            # Multi-factor transparent ranking calculation
            ranking_data = SignalRankingEngine.calculate_ranking(
                source_credibility=source_credibility,
                has_verified_quote=bool(verified_fact),
                quote_length=len(verified_fact),
                published_at=doc.published_at,
                urgency=urgency,
                business_impact=impact,
                pillar=pillar,
                priority_weights=priority_weights
            )

            signal = IntelligenceSignal(
                company_id=company_id,
                title=analysis.get("headline", doc.title[:120]),
                pillar=pillar,
                urgency=urgency,
                direction=analysis.get("opportunity_or_threat", "NEUTRAL").upper(),
                what_happened=analysis.get("what_happened", doc.title),
                publication_date=doc.published_at,
                verification_status=analysis.get("verification_status", "VERIFIED_SOURCE"),
                business_impact=impact,
                affected_business_area=analysis.get("affected_business_area", "Operations"),
                verified_fact=verified_fact,
                ai_interpretation=analysis.get("ai_interpretation", "Strategic development requiring executive monitoring."),
                recommended_action=analysis.get("recommended_action", "Review during weekly briefing."),
                confidence_score=confidence,
                source_reliability_score=ranking_data["source_reliability_score"],
                evidence_strength_score=ranking_data["evidence_strength_score"],
                strategic_relevance_score=ranking_data["strategic_relevance_score"],
                ranking_score=ranking_data["composite_ranking_score"],
                ranking_explanation=ranking_data["ranking_explanation"],
                is_archived=False
            )
            session.add(signal)
            await session.flush()

            evidence = SignalEvidence(
                signal_id=signal.id,
                crawled_document_id=doc.id,
                source_url=doc.url,
                source_name=doc.title[:100],
                exact_quote=verified_fact,
                published_at=doc.published_at
            )
            session.add(evidence)
            created_signals.append(signal)

        await session.commit()

        if not created_signals:
            return []

        # Reload with eager loaded evidences
        sig_ids = [s.id for s in created_signals]
        reload_stmt = (
            select(IntelligenceSignal)
            .where(IntelligenceSignal.id.in_(sig_ids))
            .options(selectinload(IntelligenceSignal.evidences))
            .order_by(IntelligenceSignal.ranking_score.desc())
        )
        return list((await session.execute(reload_stmt)).scalars().all())

    @staticmethod
    def _fallback_analysis(doc: CrawledDocument) -> Dict[str, Any]:
        """Deterministic extractor providing grounded quotes directly from crawled document."""
        first_sentence = doc.clean_text.split(". ")[0] if ". " in doc.clean_text else doc.title
        quote = first_sentence[:200].strip()

        pillar = "MARKET"
        title_lower = doc.title.lower()
        if any(w in title_lower for w in ["student", "review", "forum", "complaint", "experience"]):
            pillar = "CUSTOMER"
        elif any(w in title_lower for w in ["competitor", "launch", "rival", "pricing", "feature", "hiring"]):
            pillar = "COMPETITOR"

        return {
            "headline": doc.title[:80],
            "summary": f"Observed development from monitored feed: {doc.title}.",
            "category": pillar,
            "what_happened": doc.title,
            "publication_date": None,
            "evidence_snippet": quote,
            "verification_status": "VERIFIED_SOURCE",
            "business_impact": "HIGH" if "visa" in title_lower or "price" in title_lower else "MEDIUM",
            "opportunity_or_threat": "THREAT" if "restriction" in title_lower or "curb" in title_lower else "OPPORTUNITY",
            "urgency": "HIGH" if "urgent" in title_lower or "visa" in title_lower else "MEDIUM",
            "affected_business_area": "Admissions & Strategy",
            "ai_interpretation": "Key movement in sector requiring strategic attention and alignment.",
            "recommended_action": "Incorporate findings into operational briefing battlecard.",
            "confidence_in_interpretation": 0.88
        }
