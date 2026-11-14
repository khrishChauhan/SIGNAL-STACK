import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.models.company import Company
from backend.app.models.source import IntelligenceSource
from backend.app.models.signal import IntelligenceSignal
from backend.app.models.audit import ScheduledJob, SourceHealthReport
from backend.app.services.brief_service import BriefService
from backend.app.services.source_health_service import SourceHealthService
from backend.app.services.scheduler_manager import SchedulerManager, build_cron_expression
from backend.tests.conftest import TestAsyncSessionLocal

@pytest.mark.asyncio
async def test_cron_expression_builder():
    """Validates conversion of day and time into standard 5-part cron syntax."""
    assert build_cron_expression("MON", "06:00") == "0 6 * * 1"
    assert build_cron_expression("FRI", "17:30") == "30 17 * * 5"
    assert build_cron_expression("SUNDAY", "09:15") == "15 9 * * 0"

@pytest.mark.asyncio
async def test_10_section_brief_synthesis_and_exports(db_session: AsyncSession):
    """Validates that BriefService synthesizes all 10 required sections and correctly formats HTML/Markdown exports."""
    # 1. Create company
    company = Company(
        name="StudyPortal Inc",
        website_url="https://studyportal.io",
        industry="EdTech"
    )
    db_session.add(company)
    await db_session.commit()
    await db_session.refresh(company)

    # 2. Add an intelligence signal
    signal = IntelligenceSignal(
        company_id=company.id,
        title="Destination Country Visa Streamlining Initiative",
        pillar="MARKET",
        urgency="HIGH",
        direction="OPPORTUNITY",
        verified_fact="Government official portal announced 14-day expedited student visa processing track.",
        ai_interpretation="Significant tailwind for Q3 intake; should expand partner university marketing immediately.",
        recommended_action="Broadcast visa policy updates to pre-enrolled student leads.",
        confidence_score=0.92,
        ranking_score=87.5
    )
    db_session.add(signal)
    await db_session.commit()

    # 3. Synthesize 10-section brief
    brief = await BriefService.generate_brief(
        session=db_session,
        company_id=company.id,
        week_identifier="2026-W46",
        force_refresh=True
    )

    # 4. Verify all 10 required sections are present
    assert brief is not None
    assert len(brief.executive_tldr) >= 5, "Executive summary must contain at least 5 key developments"
    assert brief.customer_voice is not None, "Customer Signals section missing"
    assert brief.competitor_movements is not None, "Competitor Intelligence section missing"
    assert brief.market_shifts is not None, "Market Intelligence section missing"
    assert brief.internal_alignment is not None, "Internal Business Intelligence section missing"
    assert len(brief.opportunities) >= 3, "Must have at least 3 actionable opportunities"
    assert len(brief.risks_and_threats) >= 1, "Risks & Threats section missing"
    assert len(brief.actions) >= 1, "Recommended Actions section missing"
    assert len(brief.what_to_watch) >= 1, "What We Should Watch section missing"
    assert len(brief.source_appendix) >= 1, "Source Appendix missing"

    # Verify source appendix fields
    appendix_item = brief.source_appendix[0]
    assert "original_source" in appendix_item
    assert "direct_url" in appendix_item
    assert "publication_date" in appendix_item
    assert "discovery_date" in appendix_item
    assert "evidence_snippet" in appendix_item
    assert "verification_status" in appendix_item

    # 5. Verify HTML Export
    html_output = BriefService.export_brief_html(brief)
    assert "<!DOCTYPE html>" in html_output
    assert "@media print" in html_output
    assert "Executive Summary" in html_output
    assert "Actionable Opportunities" in html_output
    assert "Source Appendix &amp; Citations" in html_output or "Source Appendix & Citations" in html_output

    # 6. Verify Markdown Export
    md_output = BriefService.export_brief_markdown(brief)
    assert "# " in md_output
    assert "## 1. Executive Summary" in md_output
    assert "## 6. Actionable Opportunities" in md_output
    assert "## 10. Source Appendix & Citations" in md_output

@pytest.mark.asyncio
async def test_monthly_source_audit_and_duplicate_detection(db_session: AsyncSession):
    """Tests source availability check, dead URL detection, canonical duplicate detection, and recommendations."""
    company = Company(
        name="Global Edu Corp",
        website_url="https://globaleducorp.com",
        industry="Higher Education"
    )
    db_session.add(company)
    await db_session.commit()
    await db_session.refresh(company)

    # Add duplicate sources and an invalid domain
    src1 = IntelligenceSource(
        company_id=company.id,
        name="Source Alpha",
        url="https://example.com/feed",
        pillar="MARKET",
        source_type="RSS",
        approval_status="APPROVED",
        health_status="HEALTHY"
    )
    src2 = IntelligenceSource(
        company_id=company.id,
        name="Source Alpha Duplicate",
        url="https://example.com/feed/",  # Duplicate canonical URL
        pillar="MARKET",
        source_type="RSS",
        approval_status="APPROVED",
        health_status="HEALTHY"
    )
    src3 = IntelligenceSource(
        company_id=company.id,
        name="Dead Endpoint",
        url="https://nonexistent-domain-signal-stack-999.xyz/broken",  # Dead URL
        pillar="CUSTOMER",
        source_type="FORUM",
        approval_status="APPROVED",
        health_status="HEALTHY"
    )
    db_session.add_all([src1, src2, src3])
    await db_session.commit()

    # Execute monthly audit
    report = await SourceHealthService.run_monthly_audit(db_session, company.id)

    assert report.total_sources == 3
    assert report.duplicate_sources_count >= 1, "Failed to identify duplicate canonical source"
    assert report.dead_urls_count >= 1, "Failed to flag unreachable endpoint as dead URL"
    assert len(report.recommendations) > 0, "Expected actionable recommendations in audit report"

    # Verify rule: sources are NEVER deleted automatically without user approval
    src_check = select(IntelligenceSource).where(IntelligenceSource.company_id == company.id)
    remaining_sources = list((await db_session.execute(src_check)).scalars().all())
    assert len(remaining_sources) == 3, "Audit must not auto-delete sources without user confirmation"

@pytest.mark.asyncio
async def test_weekly_briefing_workflow_execution(db_session: AsyncSession, monkeypatch):
    """Tests autonomous weekly briefing workflow orchestration, DB logging, and status tracking."""
    # Point scheduler manager to in-memory test DB session
    monkeypatch.setattr("backend.app.services.scheduler_manager.AsyncSessionLocal", TestAsyncSessionLocal)

    company = Company(
        name="MeetUniversity Autonomous Demo",
        website_url="https://www.meetuniversity.com",
        industry="Study Abroad EdTech"
    )
    db_session.add(company)
    await db_session.commit()
    await db_session.refresh(company)

    # Initialize a scheduled job record
    job = ScheduledJob(
        company_id=company.id,
        job_name="WEEKLY_BRIEF",
        cron_expression="0 6 * * 1",
        timezone="UTC",
        briefing_day="MON",
        briefing_time="06:00",
        is_active=True
    )
    db_session.add(job)
    await db_session.commit()

    # Execute the weekly briefing workflow
    res = await SchedulerManager.execute_weekly_briefing_workflow(company.id, session=db_session)
    assert res["status"] == "SUCCESS"
    assert "brief_id" in res
    assert res["duration_ms"] >= 0

    # Verify ScheduledJob state was updated in DB
    await db_session.refresh(job)
    assert job.last_status == "SUCCESS"
    assert job.last_run_at is not None
    assert job.last_duration_ms is not None
    assert len(job.execution_logs) >= 1

@pytest.mark.asyncio
async def test_api_scheduling_and_export_endpoints(client: AsyncClient, db_session: AsyncSession):
    """Tests REST endpoints for schedule configuration, manual triggers, and report exports."""
    # 1. Create company
    comp_res = await client.post("/api/companies", json={
        "name": "SaaS Briefing Test Co",
        "website_url": "https://testbriefs.com",
        "industry": "Enterprise Software"
    })
    company_id = comp_res.json()["data"]["id"]

    # 2. Configure schedule via POST
    sched_res = await client.post(f"/api/companies/{company_id}/schedules", json={
        "job_name": "WEEKLY_BRIEF",
        "cron_expression": "0 6 * * 1",
        "timezone": "America/New_York",
        "briefing_day": "MON",
        "briefing_time": "08:00",
        "monitoring_frequency": "DAILY",
        "is_active": True
    })
    assert sched_res.status_code == 201
    schedule_id = sched_res.json()["data"]["id"]
    assert sched_res.json()["data"]["timezone"] == "America/New_York"

    # 3. Update schedule via PUT
    update_res = await client.put(f"/api/companies/{company_id}/schedules/{schedule_id}", json={
        "briefing_time": "07:30",
        "monitoring_frequency": "HOURLY"
    })
    assert update_res.status_code == 200
    assert update_res.json()["data"]["briefing_time"] == "07:30"
    assert update_res.json()["data"]["monitoring_frequency"] == "HOURLY"

    # 4. Generate a brief
    brief_res = await client.post(f"/api/companies/{company_id}/briefs/generate", json={"force_refresh": True})
    assert brief_res.status_code == 201
    brief_id = brief_res.json()["data"]["id"]

    # 5. Export HTML
    html_res = await client.get(f"/api/briefs/{brief_id}/export/html")
    assert html_res.status_code == 200
    assert "text/html" in html_res.headers["content-type"]
    assert "<!DOCTYPE html>" in html_res.text

    # 6. Export Markdown
    md_res = await client.get(f"/api/briefs/{brief_id}/export/markdown")
    assert md_res.status_code == 200
    assert "text/markdown" in md_res.headers["content-type"]
    assert "Executive Summary" in md_res.text
    assert "Actionable Opportunities" in md_res.text

    # 7. Toggle Brief Action status
    actions = brief_res.json()["data"]["actions"]
    if actions:
        action_id = actions[0]["id"]
        toggle_res = await client.patch(f"/api/briefs/actions/{action_id}")
        assert toggle_res.status_code == 200
        assert toggle_res.json()["data"]["status"] == "COMPLETED"

    # 8. Trigger manual source health audit
    audit_res = await client.post(f"/api/companies/{company_id}/source-audit")
    assert audit_res.status_code == 200
    assert "healthy_count" in audit_res.json()["data"]

    # 9. List audit history
    audits_history_res = await client.get(f"/api/companies/{company_id}/source-audits")
    assert audits_history_res.status_code == 200
    assert len(audits_history_res.json()["data"]) >= 1
