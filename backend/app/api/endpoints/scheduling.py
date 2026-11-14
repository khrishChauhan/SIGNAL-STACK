from typing import List, Dict, Any
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.db.session import get_db
from backend.app.services.scheduler_service import SchedulerService
from backend.app.services.ai.factory import get_ai_service
from backend.app.schemas.schedule import ScheduleCreate, ScheduleResponse, SourceAuditResponse
from backend.app.schemas.common import APIResponse

router = APIRouter(tags=["Scheduling, Source Audits & System Health"])

@router.get("/companies/{id}/schedules", response_model=APIResponse[List[ScheduleResponse]])
async def list_company_schedules(
    id: str,
    session: AsyncSession = Depends(get_db)
):
    """Lists automated monitoring schedules (Weekly Briefs, Monthly Audits, Daily Crawls)."""
    schedules = await SchedulerService.list_schedules(session, id)
    return APIResponse(data=schedules)

@router.post("/companies/{id}/schedules", response_model=APIResponse[ScheduleResponse], status_code=status.HTTP_201_CREATED)
async def create_company_schedule(
    id: str,
    body: ScheduleCreate,
    session: AsyncSession = Depends(get_db)
):
    """Configures a recurring background schedule using standard cron expression."""
    schedule = await SchedulerService.create_schedule(session, id, body)
    return APIResponse(data=schedule, message=f"Schedule for {schedule.job_name} initialized.")

@router.post("/companies/{id}/source-audit", response_model=APIResponse[SourceAuditResponse])
async def trigger_source_health_audit(
    id: str,
    session: AsyncSession = Depends(get_db)
):
    """Executes an immediate monthly source health audit (latency, HTTP codes, and yield)."""
    report = await SchedulerService.run_source_audit(session, id)
    return APIResponse(
        data=report,
        message=f"Audit completed: {report.healthy_count} healthy, {report.warning_count} warnings, {report.broken_count} broken."
    )

@router.get("/health", response_model=APIResponse[Dict[str, Any]])
async def system_health():
    """System health ping."""
    return APIResponse(
        data={"status": "online", "service": "Signal Stack API", "version": "1.0.0"}
    )

@router.get("/ai/health", response_model=APIResponse[Dict[str, Any]])
async def ai_provider_health():
    """Checks active AI provider availability and model status."""
    ai_service = get_ai_service()
    health = await ai_service.check_health()
    return APIResponse(data=health)
