from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.models.audit import ScheduledJob, SourceHealthReport
from backend.app.models.company import Company
from backend.app.schemas.schedule import ScheduleCreate, ScheduleUpdate
from backend.app.services.source_health_service import SourceHealthService
from backend.app.services.scheduler_manager import SchedulerManager, build_cron_expression
from backend.app.core.errors import ResourceNotFoundError
from backend.app.core.logging import logger

class SchedulerService:
    @staticmethod
    async def list_schedules(session: AsyncSession, company_id: str) -> List[ScheduledJob]:
        stmt = (
            select(ScheduledJob)
            .where(ScheduledJob.company_id == company_id)
            .order_by(ScheduledJob.created_at.desc())
        )
        return list((await session.execute(stmt)).scalars().all())

    @staticmethod
    async def create_schedule(
        session: AsyncSession,
        company_id: str,
        data: ScheduleCreate
    ) -> ScheduledJob:
        stmt = select(Company).where(Company.id == company_id)
        comp = (await session.execute(stmt)).scalar_one_or_none()
        if not comp:
            raise ResourceNotFoundError("Company", company_id)

        cron = data.cron_expression
        if data.briefing_day and data.briefing_time:
            cron = build_cron_expression(data.briefing_day, data.briefing_time)

        job = ScheduledJob(
            company_id=company_id,
            job_name=data.job_name,
            cron_expression=cron,
            timezone=data.timezone,
            briefing_day=data.briefing_day,
            briefing_time=data.briefing_time,
            monitoring_frequency=data.monitoring_frequency,
            is_active=data.is_active,
            last_status="INITIALIZED"
        )
        session.add(job)
        await session.commit()
        await session.refresh(job)

        # Register in APScheduler
        try:
            SchedulerManager.get_instance().register_or_update_job(job)
        except Exception as e:
            logger.warning(f"Could not register job in APScheduler: {e}")

        return job

    @staticmethod
    async def update_schedule(
        session: AsyncSession,
        company_id: str,
        schedule_id: str,
        data: ScheduleUpdate
    ) -> ScheduledJob:
        stmt = select(ScheduledJob).where(
            ScheduledJob.id == schedule_id,
            ScheduledJob.company_id == company_id
        )
        job = (await session.execute(stmt)).scalar_one_or_none()
        if not job:
            raise ResourceNotFoundError("ScheduledJob", schedule_id)

        if data.briefing_day is not None:
            job.briefing_day = data.briefing_day
        if data.briefing_time is not None:
            job.briefing_time = data.briefing_time
        if data.timezone is not None:
            job.timezone = data.timezone
        if data.monitoring_frequency is not None:
            job.monitoring_frequency = data.monitoring_frequency
        if data.is_active is not None:
            job.is_active = data.is_active

        if data.cron_expression is not None:
            job.cron_expression = data.cron_expression
        elif data.briefing_day is not None or data.briefing_time is not None:
            job.cron_expression = build_cron_expression(job.briefing_day, job.briefing_time)

        await session.commit()
        await session.refresh(job)

        # Sync update with APScheduler
        try:
            SchedulerManager.get_instance().register_or_update_job(job)
        except Exception as e:
            logger.warning(f"Could not update APScheduler job: {e}")

        return job

    @staticmethod
    async def run_source_audit(session: AsyncSession, company_id: str) -> SourceHealthReport:
        """Audits all sources using the comprehensive Phase 5 SourceHealthService."""
        return await SourceHealthService.run_monthly_audit(session, company_id)

    @staticmethod
    async def list_audit_history(session: AsyncSession, company_id: str) -> List[SourceHealthReport]:
        return await SourceHealthService.list_audit_history(session, company_id)
