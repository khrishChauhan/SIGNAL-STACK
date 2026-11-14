from typing import List, Optional
from fastapi import APIRouter, Depends, status, Response
from fastapi.responses import HTMLResponse, PlainTextResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.db.session import get_db
from backend.app.models.brief import BriefAction
from backend.app.services.brief_service import BriefService
from backend.app.schemas.brief import BriefResponse, BriefGenerateRequest, BriefActionResponse
from backend.app.schemas.common import APIResponse
from backend.app.core.errors import ResourceNotFoundError

router = APIRouter(tags=["Monday Morning Briefs"])

@router.post("/companies/{id}/briefs/generate", response_model=APIResponse[BriefResponse], status_code=status.HTTP_201_CREATED)
async def generate_monday_morning_brief(
    id: str,
    body: BriefGenerateRequest = BriefGenerateRequest(),
    session: AsyncSession = Depends(get_db)
):
    """Synthesizes the comprehensive Monday Morning Intelligence Brief using ranked signals and RAG."""
    brief = await BriefService.generate_brief(
        session,
        id,
        week_identifier=body.week_identifier,
        force_refresh=body.force_refresh
    )
    return APIResponse(
        data=brief,
        message=f"Monday Morning Brief '{brief.title}' generated successfully."
    )

@router.get("/companies/{id}/briefs", response_model=APIResponse[List[BriefResponse]])
async def list_company_briefs(
    id: str,
    session: AsyncSession = Depends(get_db)
):
    """Fetches historical archive of past weekly briefs."""
    briefs = await BriefService.list_briefs(session, id)
    return APIResponse(data=briefs)

@router.get("/briefs/{id}", response_model=APIResponse[BriefResponse])
async def get_brief_details(
    id: str,
    session: AsyncSession = Depends(get_db)
):
    """Retrieves full briefing payload including strategic alert, movements, RAG alignment, and action items."""
    brief = await BriefService.get_brief(session, id)
    return APIResponse(data=brief)

@router.get("/briefs/{id}/export/html", response_class=HTMLResponse)
async def export_brief_as_html(
    id: str,
    session: AsyncSession = Depends(get_db)
):
    """Exports briefing as a standalone, CEO-ready, printable HTML document."""
    brief = await BriefService.get_brief(session, id)
    html_content = BriefService.export_brief_html(brief)
    return HTMLResponse(content=html_content, status_code=200)

@router.get("/briefs/{id}/export/markdown", response_class=PlainTextResponse)
async def export_brief_as_markdown(
    id: str,
    session: AsyncSession = Depends(get_db)
):
    """Exports briefing as structured, GitHub-flavored Markdown."""
    brief = await BriefService.get_brief(session, id)
    md_content = BriefService.export_brief_markdown(brief)
    return PlainTextResponse(
        content=md_content,
        media_type="text/markdown",
        headers={"Content-Disposition": f"attachment; filename=brief-{brief.brief_week}.md"}
    )

@router.patch("/briefs/actions/{action_id}", response_model=APIResponse[BriefActionResponse])
async def toggle_brief_action_status(
    action_id: str,
    session: AsyncSession = Depends(get_db)
):
    """Toggles action item completion state between PENDING and COMPLETED."""
    stmt = select(BriefAction).where(BriefAction.id == action_id)
    action = (await session.execute(stmt)).scalar_one_or_none()
    if not action:
        raise ResourceNotFoundError("BriefAction", action_id)

    action.status = "COMPLETED" if action.status != "COMPLETED" else "PENDING"
    await session.commit()
    await session.refresh(action)
    return APIResponse(
        data=action,
        message=f"Action '{action.action_text[:30]}' marked as {action.status}."
    )
