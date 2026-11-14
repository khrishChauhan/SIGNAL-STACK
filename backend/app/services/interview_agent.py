from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from backend.app.services.ai.factory import get_ai_service
from backend.app.core.logging import logger

INTERVIEW_TOPICS = [
    {"topic": "Revenue streams & Monetization", "dimension": "revenue_model"},
    {"topic": "Customer segments & ICP Prioritization", "dimension": "target_customer"},
    {"topic": "Customer pain points & Friction", "dimension": "customer_pain"},
    {"topic": "Defensible competitive advantages & Moats", "dimension": "competitive_moat"},
    {"topic": "Competitor threats & Rival tracking", "dimension": "competitors"},
    {"topic": "Market developments & Industry trends", "dimension": "market_trends"},
    {"topic": "Business risks & Regulatory headwinds", "dimension": "business_risks"},
    {"topic": "Growth objectives & 12-month milestones", "dimension": "growth_goals"},
    {"topic": "Internal information & Critical blindspots", "dimension": "internal_blindspots"},
    {"topic": "Important founder decisions & Early warning triggers", "dimension": "early_warning_triggers"}
]

class AdaptiveInterviewAgent:
    """Agent responsible for conducting the sequential, adaptive 10-question

    strategic calibration interview with memory and dynamic follow-ups.
    """

    @staticmethod
    async def generate_question(
        question_number: int,
        company_name: str,
        company_profile: Dict[str, Any],
        prior_qa_history: List[Dict[str, str]]
    ) -> Dict[str, Any]:
        """Formulates an adaptive question calibrated to the current topic

        and prior answers given by the founder.
        """
        topic_info = INTERVIEW_TOPICS[question_number - 1]
        topic_name = topic_info["topic"]

        # Format history string
        history_lines = []
        for item in prior_qa_history:
            history_lines.append(f"Q: {item.get('question', '')}\nA: {item.get('answer', '')}")
        history_str = "\n".join(history_lines) if history_lines else "None (Opening Question)"

        prompt = f"""
You are the Executive Adaptive Interview Agent.
Company Name: {company_name}
Company Profile Summary: {company_profile.get('executive_summary', '')}
Products/Services: {company_profile.get('products_and_services', [])}
Industry: {company_profile.get('industry', '')}

Current Question Number: {question_number} of 10
Assigned Strategic Topic: '{topic_name}'

Full Prior Interview Q&A History:
{history_str}

RULES:
1. Generate Question #{question_number} exploring '{topic_name}'.
2. Ground the question specifically in {company_name}'s domain.
3. CONTEXTUAL FOLLOW-UP: If prior answers revealed specific pain points, rivals, or decisions, directly reference them!
4. Avoid repeating themes already fully resolved.
5. Provide a clear, strategic rationale explaining why an executive should answer this.

Return JSON:
{{
  "question_number": {question_number},
  "category": "{topic_name}",
  "question_text": "Incisive, non-generic question referencing their business",
  "rationale": "Strategic reasoning for probing this dimension"
}}
"""
        ai_service = get_ai_service()
        try:
            result = await ai_service.generate_json(prompt)
            if "question_text" in result and result["question_text"]:
                result["question_number"] = question_number
                result["category"] = topic_name
                return result
        except Exception as e:
            logger.warning(f"AI question generation failed: {e}. Using adaptive fallback.")

        return AdaptiveInterviewAgent._fallback_adaptive_question(
            question_number=question_number,
            company_name=company_name,
            prior_qa_history=prior_qa_history
        )

    @staticmethod
    def _fallback_adaptive_question(
        question_number: int,
        company_name: str,
        prior_qa_history: List[Dict[str, str]]
    ) -> Dict[str, Any]:
        topic_info = INTERVIEW_TOPICS[question_number - 1]
        topic = topic_info["topic"]

        # Check last answer to weave into follow-up
        last_answer = prior_qa_history[-1].get("answer", "") if prior_qa_history else ""
        context_hook = f"Following up on your previous point ('{last_answer[:60]}...'), " if last_answer and not last_answer.startswith("[Skipped") else ""

        fallbacks = {
            1: f"Regarding revenue streams, how does {company_name} structure its monetization across institutional partners and end customers, and where do you expect the fastest margin expansion?",
            2: f"Which specific customer segment currently generates your highest lifetime value (LTV), and what customer archetype represents your biggest acquisition bottleneck?",
            3: f"{context_hook}What is the most acute friction point or complaint your prospective users express before committing to your platform over legacy alternatives?",
            4: f"What is {company_name}'s core defensible moat (e.g. proprietary data, distribution lock-in, regulatory compliance) that prevents rivals from replicating your offering?",
            5: f"Which direct competitors or emerging substitute products do you monitor most closely, and what recent rival feature or pricing move raised concern?",
            6: f"What impending macroeconomic, regulatory, or platform policy developments in your sector could disrupt your current operational assumptions?",
            7: f"What is the single highest-probability business risk or operational vulnerability that currently concerns executive leadership over the next 12 months?",
            8: f"What are your top 2 non-negotiable quantitative growth objectives or milestones for the upcoming fiscal year?",
            9: f"What internal metric, customer behavior data, or operational performance indicator do you currently lack adequate visibility into?",
            10: f"What specific early warning signal (e.g. key competitor fundraise, regulation shift, client churn spike) would immediately trigger a board-level strategic pivot?"
        }

        question_text = fallbacks.get(question_number, f"What strategic priority in '{topic}' matters most to {company_name} right now?")
        return {
            "question_number": question_number,
            "category": topic,
            "question_text": question_text,
            "rationale": f"Calibrates executive priorities for '{topic}' to guide Monday Morning briefing filters."
        }

    @staticmethod
    def synthesize_priority_vector(
        company_profile: Dict[str, Any],
        qa_history: List[Dict[str, str]]
    ) -> Dict[str, Any]:
        """Synthesizes interview answers into a normalized weight vector for signal ranking."""
        weights = {
            "revenue_model_weight": 0.8,
            "customer_pain_weight": 0.85,
            "competitive_moat_weight": 0.9,
            "competitor_threat_weight": 0.95,
            "regulatory_risk_weight": 0.85,
            "growth_goals_weight": 0.8,
            "early_warning_weight": 0.95
        }

        # Analyze answers for specific priority keywords
        all_text = " ".join([item.get("answer", "") for item in qa_history]).lower()
        if "pricing" in all_text or "margin" in all_text or "discount" in all_text:
            weights["competitor_threat_weight"] = 1.0
            weights["pricing_sensitivity"] = 0.95
        if "visa" in all_text or "regulation" in all_text or "policy" in all_text or "government" in all_text:
            weights["regulatory_risk_weight"] = 1.0
        if "churn" in all_text or "retention" in all_text or "dropoff" in all_text:
            weights["customer_pain_weight"] = 0.95

        weights["calibration_completed_at"] = datetime.now(timezone.utc).isoformat()
        weights["total_answered"] = len([q for q in qa_history if not q.get("answer", "").startswith("[Skipped")])
        weights["total_skipped"] = len([q for q in qa_history if q.get("answer", "").startswith("[Skipped")])
        weights["interview_completed"] = True
        return weights
