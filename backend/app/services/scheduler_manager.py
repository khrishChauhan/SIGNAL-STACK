import asyncio
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
import time
from zoneinfo import ZoneInfo
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy import select, update
from backend.app.db.session import AsyncSessionLocal
from backend.app.models.audit import ScheduledJob
from backend.app.models.company import Company
from backend.app.services.crawling_engine import WebCrawlingEngine
from backend.app.services.intelligence_analysis_agent import IntelligenceAnalysisAgent
from backend.app.services.brief_service import BriefService
from backend.app.services.source_health_service import SourceHealthService
from backend.app.core.logging import logger

DAY_MAP = {
    "MON": 1, "MONDAY": 1,
    "TUE": 2, "TUESDAY": 2,
    "WED": 3, "WEDNESDAY": 3,
    "THU": 4, "THURSDAY": 4,
    "FRI": 5, "FRIDAY": 5,
    "SAT": 6, "SATURDAY": 6,
    "SUN": 0, "SUNDAY": 0,
}

def build_cron_expression(day_str: str, time_str: str) -> str:
    """Builds standard 5-part cron syntax from day (e.g. 'MON') and time (e.g. '06:00')."""
    try:
        parts = time_str.strip().split(":")
        hour = int(parts[0])
        minute = int(parts[1]) if len(parts) > 1 else 0
        dow = DAY_MAP.get(day_str.strip().upper(), 1)
        return f"{minute} {hour} * * {dow}"
    except Exception:
        return "0 6 * * 1"

class SchedulerManager:
    _instance: Optional["SchedulerManager"] = None
    scheduler: AsyncIOScheduler

    def __init__(self):
        self.scheduler = AsyncIOScheduler()

    @classmethod
    def get_instance(cls) -> "SchedulerManager":
        if cls._instance is None:
            cls._instance = SchedulerManager()
        return cls._instance

    def start(self):
        if not self.scheduler.running:
            self.scheduler.start()
            logger.info("APScheduler AsyncIOScheduler started successfully.")

    def shutdown(self):
        if self.scheduler.running:
            self.scheduler.shutdown(wait=False)
            logger.info("APScheduler AsyncIOScheduler shut down cleanly.")

    @staticmethod
    async def execute_weekly_briefing_workflow(
        company_id: str,
        week_identifier: Optional[str] = None
    ) -> Dict[str, Any]:
        """Autonomous Weekly Monday Morning Intelligence Brief Workflow:

        1. Load company & approved sources
        2. Crawl sources with deduplication & change tracking
        3. Extract evidence and analyze signals
        4. Rank signals via multi-factor engine
        5. Generate complete 10-section Monday Brief
        6. Persist brief and record execution history
        """
        start_time = time.time()
        now = datetime.now(timezone.utc)
        job_log = {
            "timestamp": now.isoformat(),
            "action": "WEEKLY_BRIEF_WORKFLOW",
            "company_id": company_id
        }

        async with AsyncSessionLocal() as session:
            job_stmt = select(ScheduledJob).where(
                ScheduledJob.company_id == company_id,
                ScheduledJob.job_name == "WEEKLY_BRIEF"
            )
            job = (await session.execute(job_stmt)).scalar_one_or_none()

            try:
                # 1. Verify Company
                comp_stmt = select(Company).where(Company.id == company_id)
                company = (await session.execute(comp_stmt)).scalar_one_or_none()
                if not company:
                    raise ValueError(f"Company {company_id} not found")

                logger.info(f"Starting automated weekly briefing workflow for {company.name}")

                # 2. Run crawl cycle on all approved sources
                crawl_job = await WebCrawlingEngine.run_crawl_cycle(
                    session=session,
                    company_id=company_id,
                    force_all_approved=True
                )
                job_log["crawled_items"] = crawl_job.items_crawled
                job_log["extracted_items"] = crawl_job.items_extracted

                # 3. Process new documents into ranked signals
                new_signals = await IntelligenceAnalysisAgent.process_company_documents(
                    session=session,
                    company_id=company_id,
                    limit_documents=15
                )
                job_log["signals_generated"] = len(new_signals)

                # 4. Generate the Monday Morning Brief (forces fresh synthesis)
                brief = await BriefService.generate_brief(
                    session=session,
                    company_id=company_id,
                    week_identifier=week_identifier,
                    force_refresh=True
                )
                job_log["brief_id"] = brief.id
                job_log["brief_week"] = brief.brief_week

                duration_ms = int((time.time() - start_time) * 1000)
                job_log["status"] = "SUCCESS"
                job_log["duration_ms"] = duration_ms

                # 5. Update ScheduledJob record
                if job:
                    job.last_run_at = now
                    job.last_status = "SUCCESS"
                    job.last_duration_ms = duration_ms
                    job.last_error = None
                    current_logs = list(job.execution_logs or [])
                    current_logs.insert(0, job_log)
                    job.execution_logs = current_logs[:30]  # keep latest 30 runs
                    await session.commit()

                logger.info(f"Automated weekly brief {brief.brief_week} generated successfully in {duration_ms}ms")
                return {
                    "status": "SUCCESS",
                    "brief_id": brief.id,
                    "brief_week": brief.brief_week,
                    "duration_ms": duration_ms
                }

            except Exception as e:
                duration_ms = int((time.time() - start_time) * 1000)
                err_msg = str(e)
                job_log["status"] = "FAILED"
                job_log["duration_ms"] = duration_ms
                job_log["error"] = err_msg
                logger.error(f"Error in weekly briefing workflow for company {company_id}: {err_msg}", exc_info=True)

                if job:
                    job.last_run_at = now
                    job.last_status = "FAILED"
                    job.last_duration_ms = duration_ms
                    job.last_error = err_msg[:500]
                    current_logs = list(job.execution_logs or [])
                    current_logs.insert(0, job_log)
                    job.execution_logs = current_logs[:30]
                    await session.commit()

                raise

    @staticmethod
    async def execute_monthly_audit_workflow(company_id: str) -> Dict[str, Any]:
        """Autonomous Monthly Signal Stack Audit Workflow:

        1. Test connectivity and response times of all sources
        2. Detect dead URLs, duplicate endpoints, and inactive sources
        3. Discover alternative replacement candidates
        4. Generate source health report & audit recommendations
        5. Persist audit history without destructive auto-deletion
        """
        start_time = time.time()
        now = datetime.now(timezone.utc)
        job_log = {
            "timestamp": now.isoformat(),
            "action": "MONTHLY_AUDIT_WORKFLOW",
            "company_id": company_id
        }

        async with AsyncSessionLocal() as session:
            job_stmt = select(ScheduledJob).where(
                ScheduledJob.company_id == company_id,
                ScheduledJob.job_name == "MONTHLY_HEALTH_AUDIT"
            )
            job = (await session.execute(job_stmt)).scalar_one_or_none()

            try:
                report = await SourceHealthService.run_monthly_audit(session, company_id)
                duration_ms = int((time.time() - start_time) * 1000)

                job_log["status"] = "SUCCESS"
                job_log["duration_ms"] = duration_ms
                job_log["report_id"] = report.id
                job_log["total_sources"] = report.total_sources
                job_log["healthy_count"] = report.healthy_count
                job_log["dead_urls"] = report.dead_urls_count

                if job:
                    job.last_run_at = now
                    job.last_status = "SUCCESS"
                    job.last_duration_ms = duration_ms
                    job.last_error = None
                    current_logs = list(job.execution_logs or [])
                    current_logs.insert(0, job_log)
                    job.execution_logs = current_logs[:30]
                    await session.commit()

                logger.info(f"Monthly source health audit completed for {company_id} in {duration_ms}ms")
                return {
                    "status": "SUCCESS",
                    "report_id": report.id,
                    "duration_ms": duration_ms
                }
            except Exception as e:
                duration_ms = int((time.time() - start_time) * 1000)
                err_msg = str(e)
                job_log["status"] = "FAILED"
                job_log["duration_ms"] = duration_ms
                job_log["error"] = err_msg

                if job:
                    job.last_run_at = now
                    job.last_status = "FAILED"
                    job.last_duration_ms = duration_ms
                    job.last_error = err_msg[:500]
                    current_logs = list(job.execution_logs or [])
                    current_logs.insert(0, job_log)
                    job.execution_logs = current_logs[:30]
                    await session.commit()

                raise

    def register_or_update_job(self, scheduled_job: ScheduledJob):
        """Registers or modifies a scheduled cron job in the APScheduler instance."""
        job_id = f"{scheduled_job.company_id}_{scheduled_job.job_name}"
        
        # Remove existing if present
        if self.scheduler.get_job(job_id):
            self.scheduler.remove_job(job_id)

        if not scheduled_job.is_active:
            logger.info(f"Scheduled job {job_id} is inactive; skipping registration.")
            return

        # Determine target runner coroutine
        target_fn = None
        if scheduled_job.job_name == "WEEKLY_BRIEF":
            target_fn = self.execute_weekly_briefing_workflow
        elif scheduled_job.job_name == "MONTHLY_HEALTH_AUDIT":
            target_fn = self.execute_monthly_audit_workflow
        else:
            logger.warning(f"Unknown job_name {scheduled_job.job_name}; skipping.")
            return

        try:
            tz = ZoneInfo(scheduled_job.timezone or "UTC")
        except Exception:
            tz = ZoneInfo("UTC")

        # Parse cron expression
        cron_expr = scheduled_job.cron_expression or "0 6 * * 1"
        try:
            trigger = CronTrigger.from_crontab(cron_expr, timezone=tz)
        except Exception as e:
            logger.error(f"Invalid cron expression '{cron_expr}' for job {job_id}: {e}")
            trigger = CronTrigger.from_crontab("0 6 * * 1", timezone=tz)

        self.scheduler.add_job(
            func=target_fn,
            trigger=trigger,
            args=[scheduled_job.company_id],
            id=job_id,
            name=f"{scheduled_job.job_name} for {scheduled_job.company_id}",
            replace_existing=True
        )
        logger.info(f"Registered scheduled job {job_id} with cron '{cron_expr}' and timezone '{tz}'")

    async def sync_all_jobs_from_db(self):
        """Loads all active scheduled jobs from the database and synchronizes APScheduler."""
        async with AsyncSessionLocal() as session:
            stmt = select(ScheduledJob).where(ScheduledJob.is_active == True)
            active_jobs = list((await session.execute(stmt)).scalars().all())
            for job in active_jobs:
                try:
                    self.register_or_update_job(job)
                except Exception as e:
                    logger.error(f"Failed to sync job {job.id}: {e}")
            logger.info(f"Synchronized {len(active_jobs)} active scheduled jobs into APScheduler.")
