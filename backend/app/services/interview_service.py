from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from backend.app.models.company import Company, CompanyProfile
from backend.app.models.interview import InterviewSession, InterviewQuestion, InterviewAnswer
from backend.app.services.interview_agent import AdaptiveInterviewAgent, INTERVIEW_TOPICS
from backend.app.services.ai.factory import get_ai_service
from backend.app.core.errors import ResourceNotFoundError, SignalStackException
from backend.app.core.logging import logger

CATEGORIES_SEQUENCE = [
    "Defensible Moat & Advantage",
    "Pricing Power & Margin Resilience",
    "Customer Acquisition & Funnel Bottlenecks",
    "Competitor Threats & Rival Monitoring",
    "Regulatory, Policy & Geopolitical Shifts",
    "Product Differentiation & Innovation Vectors",
    "Customer Churn & Negative Retention Feedback",
    "Distribution Partnerships & Channel Alliances",
    "Internal Blindspots & Intelligence Gaps",
    "Early Warning Triggers & Pivot Signals"
]

class InterviewService:
    @staticmethod
    async def start_session(
        session: AsyncSession,
        company_id: str,
        restart: bool = False
    ) -> InterviewSession:
        # Check company existence
        stmt = select(Company).where(Company.id == company_id).options(selectinload(Company.profile))
        company = (await session.execute(stmt)).scalar_one_or_none()
        if not company:
            raise ResourceNotFoundError("Company", company_id)

        # Look for existing active session unless restart requested
        if not restart:
            existing_stmt = (
                select(InterviewSession)
                .where(
                    InterviewSession.company_id == company_id,
                    InterviewSession.status.in_(["IN_PROGRESS", "NOT_STARTED"])
                )
                .options(
                    selectinload(InterviewSession.questions),
                    selectinload(InterviewSession.answers)
                )
                .order_by(InterviewSession.created_at.desc())
            )
            existing = (await session.execute(existing_stmt)).scalar_one_or_none()
            if existing:
                return existing

        # Create new session
        interview_session = InterviewSession(
            company_id=company_id,
            status="IN_PROGRESS",
            current_question_number=1,
            total_questions=10,
            strategic_priorities={},
            started_at=datetime.now(timezone.utc)
        )
        session.add(interview_session)
        await session.flush()

        # Generate Question 1 grounded in company profile via AdaptiveInterviewAgent
        profile = company.profile
        profile_dict = {
            "executive_summary": profile.executive_summary if profile else f"{company.name} in {company.industry or 'Technology'}",
            "products_and_services": profile.core_strengths if profile else [],
            "industry": company.industry or "Technology"
        }
        q1_data = await AdaptiveInterviewAgent.generate_question(
            question_number=1,
            company_name=company.name,
            company_profile=profile_dict,
            prior_qa_history=[]
        )

        first_question = InterviewQuestion(
            session_id=interview_session.id,
            company_id=company_id,
            question_number=1,
            question_text=q1_data.get("question_text", f"What is {company.name}'s primary defensible moat against direct competitors?"),
            category=q1_data.get("category", "Revenue streams & Monetization"),
            rationale=q1_data.get("rationale", "Establishes competitive baseline."),
            is_skipped=False
        )
        session.add(first_question)
        company.onboarding_status = "INTERVIEW_IN_PROGRESS"

        await session.commit()

        # Reload with relationships
        return await InterviewService.get_session(session, interview_session.id)

    @staticmethod
    async def get_session(session: AsyncSession, session_id: str) -> InterviewSession:
        session.expire_all()
        stmt = (
            select(InterviewSession)
            .where(InterviewSession.id == session_id)
            .options(
                selectinload(InterviewSession.questions),
                selectinload(InterviewSession.answers),
                selectinload(InterviewSession.company)
            )
        )
        result = await session.execute(stmt)
        interview_session = result.scalar_one_or_none()
        if not interview_session:
            raise ResourceNotFoundError("InterviewSession", session_id)

        # Attach current question object
        current_q = next((q for q in interview_session.questions if q.question_number == interview_session.current_question_number), None)
        interview_session.current_question = current_q
        return interview_session

    @staticmethod
    async def submit_answer(
        session: AsyncSession,
        session_id: str,
        answer_text: str
    ) -> InterviewSession:
        interview_session = await InterviewService.get_session(session, session_id)
        if interview_session.status == "COMPLETED":
            raise SignalStackException("Interview session is already completed.")

        current_q_num = interview_session.current_question_number
        # Find current question
        question = next((q for q in interview_session.questions if q.question_number == current_q_num), None)
        if not question:
            raise SignalStackException(f"Question #{current_q_num} not found in session.")

        # Save answer
        answer = InterviewAnswer(
            session_id=session_id,
            question_id=question.id,
            company_id=interview_session.company_id,
            question_number=current_q_num,
            answer_text=answer_text.strip(),
            extracted_insights={"recorded_at": datetime.now(timezone.utc).isoformat()}
        )
        session.add(answer)
        await session.flush()

        # Determine next step
        if current_q_num < 10:
            next_q_num = current_q_num + 1
            interview_session.current_question_number = next_q_num

            # Collect prior Q&A history
            prior_qa_history: List[Dict[str, str]] = []
            for a in interview_session.answers:
                q_text = next((q.question_text for q in interview_session.questions if q.id == a.question_id), "")
                prior_qa_history.append({"question": q_text, "answer": a.answer_text})
            # Include the current answer if not already in history
            if not any(item["question"] == question.question_text for item in prior_qa_history):
                prior_qa_history.append({"question": question.question_text, "answer": answer_text})

            company = interview_session.company
            profile = company.profile if company else None
            profile_dict = {
                "executive_summary": profile.executive_summary if profile else (company.industry if company else "Technology"),
                "products_and_services": profile.core_strengths if profile else [],
                "industry": company.industry if company else "Technology"
            }

            next_q_data = await AdaptiveInterviewAgent.generate_question(
                question_number=next_q_num,
                company_name=company.name if company else "Company",
                company_profile=profile_dict,
                prior_qa_history=prior_qa_history
            )

            next_question = InterviewQuestion(
                session_id=session_id,
                company_id=interview_session.company_id,
                question_number=next_q_num,
                question_text=next_q_data.get("question_text", f"Adaptive question #{next_q_num} for {company.name if company else 'Company'}"),
                category=next_q_data.get("category", f"Topic #{next_q_num}"),
                rationale=next_q_data.get("rationale", "Adaptive follow-up grounded in prior answers."),
                is_skipped=False
            )
            session.add(next_question)
        else:
            # Interview Complete!
            interview_session.status = "COMPLETED"
            interview_session.completed_at = datetime.now(timezone.utc)

            # Synthesize dynamic priority weights
            company = interview_session.company
            profile = company.profile if company else None
            profile_dict = {
                "executive_summary": profile.executive_summary if profile else (company.industry if company else "Technology"),
                "products_and_services": profile.core_strengths if profile else [],
                "industry": company.industry if company else "Technology"
            }
            prior_qa_history = []
            for a in interview_session.answers:
                q_text = next((q.question_text for q in interview_session.questions if q.id == a.question_id), "")
                prior_qa_history.append({"question": q_text, "answer": a.answer_text})
            if not any(item["question"] == question.question_text for item in prior_qa_history):
                prior_qa_history.append({"question": question.question_text, "answer": answer_text})

            interview_session.strategic_priorities = AdaptiveInterviewAgent.synthesize_priority_vector(
                company_profile=profile_dict,
                qa_history=prior_qa_history
            )

            # Update company status
            stmt = select(Company).where(Company.id == interview_session.company_id)
            comp = (await session.execute(stmt)).scalar_one_or_none()
            if comp:
                comp.onboarding_status = "INTERVIEW_COMPLETED"

        await session.commit()
        return await InterviewService.get_session(session, session_id)

    @staticmethod
    async def skip_question(
        session: AsyncSession,
        session_id: str,
        reason: str = "Skipped by founder"
    ) -> InterviewSession:
        interview_session = await InterviewService.get_session(session, session_id)
        if interview_session.status == "COMPLETED":
            return interview_session

        current_q_num = interview_session.current_question_number
        question = next((q for q in interview_session.questions if q.question_number == current_q_num), None)
        if question:
            question.is_skipped = True

        return await InterviewService.submit_answer(
            session=session,
            session_id=session_id,
            answer_text=f"[Skipped: {reason}]"
        )

    @staticmethod
    async def update_profile(
        session: AsyncSession,
        session_id: str,
        strategic_priorities: Dict[str, Any]
    ) -> InterviewSession:
        interview_session = await InterviewService.get_session(session, session_id)
        interview_session.strategic_priorities.update(strategic_priorities)
        await session.commit()
        return interview_session
