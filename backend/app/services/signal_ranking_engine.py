from typing import Dict, Any, Optional
from datetime import datetime, timezone

class SignalRankingEngine:
    """Transparent multi-factor ranking engine that scores signals across:

    1. Source Reliability (0-100)
    2. Evidence Strength (0-100)
    3. Strategic Relevance (0-100)
    4. Business Impact & Urgency (0-100)
    5. Recency Decay (0-100)

    AI confidence is deliberately separated from factual verification.
    """

    @staticmethod
    def calculate_ranking(
        source_credibility: float,
        has_verified_quote: bool,
        quote_length: int,
        published_at: Optional[datetime],
        urgency: str,
        business_impact: str,
        pillar: str,
        priority_weights: Dict[str, Any]
    ) -> Dict[str, Any]:
        # 1. Source Reliability Score (0-100)
        source_reliability_score = round(max(0.1, min(1.0, source_credibility)) * 100, 1)

        # 2. Evidence Strength Score (0-100)
        # Evaluates quotation presence, length, and publication date availability
        evidence_score = 50.0
        if has_verified_quote:
            evidence_score += 25.0
            if quote_length > 40:
                evidence_score += 15.0
        if published_at:
            evidence_score += 10.0
        evidence_strength_score = min(100.0, evidence_score)

        # 3. Strategic Relevance Score (0-100)
        # Grounded in founder's calibrated priority vector
        relevance_base = 75.0
        if pillar == "COMPETITOR":
            weight = priority_weights.get("competitor_threat_weight", 0.9)
            relevance_base = 70.0 + (weight * 25.0)
        elif pillar == "MARKET":
            weight = priority_weights.get("regulatory_risk_weight", 0.85)
            relevance_base = 70.0 + (weight * 25.0)
        elif pillar == "CUSTOMER":
            weight = priority_weights.get("customer_pain_weight", 0.85)
            relevance_base = 70.0 + (weight * 25.0)
        strategic_relevance_score = min(100.0, round(relevance_base, 1))

        # 4. Business Impact & Urgency Multipliers
        urgency_weights = {"LOW": 10.0, "MEDIUM": 20.0, "HIGH": 30.0, "CRITICAL": 40.0}
        impact_weights = {"LOW": 10.0, "MEDIUM": 20.0, "HIGH": 30.0, "CRITICAL": 40.0}
        urgency_points = urgency_weights.get(urgency.upper(), 20.0)
        impact_points = impact_weights.get(business_impact.upper(), 20.0)

        # 5. Recency Decay (0-100)
        recency_score = 70.0
        if published_at:
            age_days = (datetime.now(timezone.utc) - published_at).total_seconds() / 86400.0
            if age_days <= 1.0:
                recency_score = 100.0
            elif age_days <= 7.0:
                recency_score = 90.0
            elif age_days <= 14.0:
                recency_score = 75.0
            else:
                recency_score = max(30.0, 75.0 - (age_days * 1.5))

        # 6. Composite Formula
        # 35% Strategic Relevance + 25% Impact/Urgency + 20% Evidence Strength + 10% Source Reliability + 10% Recency
        impact_urgency_normalized = ((urgency_points + impact_points) / 80.0) * 100.0
        composite_score = (
            (strategic_relevance_score * 0.35) +
            (impact_urgency_normalized * 0.25) +
            (evidence_strength_score * 0.20) +
            (source_reliability_score * 0.10) +
            (recency_score * 0.10)
        )
        composite_score = round(min(100.0, max(10.0, composite_score)), 1)

        explanation = (
            f"Ranked {composite_score}/100: "
            f"Strategic relevance ({strategic_relevance_score:.0f} pts) weighted by {pillar.lower()} priority. "
            f"Evidence strength ({evidence_strength_score:.0f} pts) reflecting verifiable source quote. "
            f"Business urgency rated {urgency} with {business_impact} impact."
        )

        return {
            "source_reliability_score": source_reliability_score,
            "evidence_strength_score": evidence_strength_score,
            "strategic_relevance_score": strategic_relevance_score,
            "composite_ranking_score": composite_score,
            "ranking_explanation": explanation
        }
