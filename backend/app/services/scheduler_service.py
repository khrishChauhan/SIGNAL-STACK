from typing import List, Dict, Any
from datetime import datetime, timezone
import time
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.models.audit import ScheduledJob, SourceHealthReport
from backend.app.models.source import IntelligenceSource
from backend.app.models.company import Company
from backend.app.schemas.schedule import ScheduleCreate
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

        job = ScheduledJob(
            company_id=company_id,
            job_name=data.job_name,
            cron_expression=data.cron_expression,
            is_active=data.is_active,
            last_status="INITIALIZED"
        )
        session.add(job)
        await session.commit()
        await session.refresh(job)
        return job

    @staticmethod
    async def run_source_audit(session: AsyncSession, company_id: str) -> SourceHealthReport:
        """Audits all sources for connectivity, response latency, and health."""
        stmt = select(IntelligenceSource).where(IntelligenceSource.company_id == company_id)
        sources = list((await session.execute(stmt)).scalars().all())

        healthy_count = 0
        warning_count = 0
        broken_count = 0
        findings = []

        async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
            for src in sources:
                start_time = time.time()
                status_result = "HEALTHY"
                http_code = 0
                latency_ms = 0.0
                recommendation = "Source operational"

                try:
                    res = await client.get(src.url, headers={"User-Agent": "SignalStackBot/1.0"})
                    http_code = res.status_code
                    latency_ms = round((time.time() - start_time) * 1000, 2)
                    if http_code in [200, 301, 302]:
                        healthy_count += 1
                        src.health_status = "HEALTHY"
                        src.consecutive_failures = 0
                    elif http_code in [403, 429]:
                        warning_count += 1
                        src.health_status = "WARNING"
                        status_result = "WARNING"
                        recommendation = f"Rate limited or forbidden (HTTP {http_code}). Consider using alternate RSS feed."
                    else:
                        broken_count += 1
                        src.health_status = "BROKEN"
                        status_result = "BROKEN"
                        recommendation = f"Endpoint returned HTTP {http_code}. Verify URL or deprecate."
                except Exception as e:
                    latency_ms = round((time.time() - start_time) * 1000, 2)
                    broken_count += 1
                    src.health_status = "BROKEN"
                    status_result = "BROKEN"
                    recommendation = f"Connection failed: {str(e)[:80]}. Check network reachability."

                findings.append({
                    "source_id": src.id,
                    "source_name": src.name,
                    "url": src.url,
                    "http_status_code": http_code,
                    "response_time_ms": latency_ms,
                    "status_result": status_result,
                    "recommendations": recommendation
                })

        report = SourceHealthReport(
            company_id=company_id,
            audit_date=datetime.now(timezone.utc),
            total_sources=len(sources),
            healthy_count=healthy_count,
            warning_count=warning_count,
            broken_count=broken_count,
            findings=findings
        )
        session.add(report)
        await session.commit()
        await session.refresh(report)
        return report
