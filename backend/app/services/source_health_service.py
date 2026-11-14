from typing import List, Dict, Any, Optional
from datetime import datetime, timezone, timedelta
import time
from urllib.parse import urlparse
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.models.audit import SourceHealthReport
from backend.app.models.source import IntelligenceSource
from backend.app.models.company import Company
from backend.app.models.competitor import Competitor
from backend.app.services.source_discovery_agent import SourceDiscoveryAgent
from backend.app.core.errors import ResourceNotFoundError
from backend.app.core.logging import logger

class SourceHealthService:
    @staticmethod
    def _normalize_url(url: str) -> str:
        """Normalizes URL for canonical duplicate detection."""
        try:
            parsed = urlparse(url.strip().lower())
            netloc = parsed.netloc.replace("www.", "")
            path = parsed.path.rstrip("/")
            return f"{netloc}{path}"
        except Exception:
            return url.strip().lower()

    @staticmethod
    async def run_monthly_audit(session: AsyncSession, company_id: str) -> SourceHealthReport:
        """Executes the monthly Signal Stack source health audit:

        1. Check source availability & latency
        2. Identify dead URLs (404, 5xx, timeouts)
        3. Detect duplicate sources (canonical collision)
        4. Detect inactive sources (> 30 days without crawls)
        5. Discover replacement sources for degraded feeds
        6. Compile recommendations (WITHOUT auto-deleting sources)
        7. Persist audit history report
        """
        stmt = select(Company).where(Company.id == company_id)
        company = (await session.execute(stmt)).scalar_one_or_none()
        if not company:
            raise ResourceNotFoundError("Company", company_id)

        # Get all sources for this company
        source_stmt = select(IntelligenceSource).where(IntelligenceSource.company_id == company_id)
        sources = list((await session.execute(source_stmt)).scalars().all())

        healthy_count = 0
        warning_count = 0
        broken_count = 0
        dead_urls_count = 0
        inactive_sources_count = 0
        duplicate_sources_count = 0
        total_latency_ms = 0.0

        now = datetime.now(timezone.utc)
        thirty_days_ago = now - timedelta(days=30)

        # 1. Duplicate Detection Map
        seen_urls: Dict[str, str] = {}  # normalized_url -> source_id
        duplicate_ids = set()
        for src in sources:
            norm = SourceHealthService._normalize_url(src.url)
            if norm in seen_urls:
                duplicate_ids.add(src.id)
                duplicate_sources_count += 1
            else:
                seen_urls[norm] = src.id

        findings: List[Dict[str, Any]] = []
        degraded_categories = set()

        # 2. Check Reachability & Activity
        async with httpx.AsyncClient(timeout=6.0, follow_redirects=True) as client:
            for src in sources:
                start_time = time.time()
                http_code = 0
                latency_ms = 0.0
                status_result = "HEALTHY"
                finding_details = []
                is_dead = False
                is_inactive = False
                is_duplicate = src.id in duplicate_ids

                # Inactivity check
                if not src.last_crawled_at or src.last_crawled_at < thirty_days_ago:
                    is_inactive = True
                    inactive_sources_count += 1
                    finding_details.append("Source has had no updates or crawls in > 30 days.")

                if is_duplicate:
                    finding_details.append("Duplicate canonical endpoint detected with another registered source.")

                try:
                    res = await client.get(src.url, headers={"User-Agent": "SignalStack-HealthAudit/1.0"})
                    http_code = res.status_code
                    latency_ms = round((time.time() - start_time) * 1000, 2)
                    total_latency_ms += latency_ms

                    if http_code in [200, 301, 302]:
                        if not is_duplicate and not is_inactive:
                            healthy_count += 1
                            src.health_status = "HEALTHY"
                            src.consecutive_failures = 0
                        else:
                            warning_count += 1
                            src.health_status = "WARNING"
                            status_result = "WARNING"
                    elif http_code in [403, 429]:
                        warning_count += 1
                        src.health_status = "WARNING"
                        status_result = "WARNING"
                        finding_details.append(f"HTTP {http_code} rate limiting or access policy encountered.")
                    else:
                        is_dead = True
                        dead_urls_count += 1
                        broken_count += 1
                        src.health_status = "BROKEN"
                        src.consecutive_failures += 1
                        status_result = "BROKEN"
                        degraded_categories.add(src.category)
                        finding_details.append(f"Dead URL: HTTP {http_code} error.")
                except Exception as exc:
                    latency_ms = round((time.time() - start_time) * 1000, 2)
                    total_latency_ms += latency_ms
                    is_dead = True
                    dead_urls_count += 1
                    broken_count += 1
                    src.health_status = "BROKEN"
                    src.consecutive_failures += 1
                    status_result = "BROKEN"
                    degraded_categories.add(src.category)
                    finding_details.append(f"Dead URL: Connection failure ({str(exc)[:60]}).")

                src.last_health_check = now
                src.error_message = "; ".join(finding_details) if finding_details else None

                findings.append({
                    "source_id": src.id,
                    "source_name": src.name,
                    "url": src.url,
                    "category": src.category,
                    "http_status_code": http_code,
                    "response_time_ms": latency_ms,
                    "status_result": status_result,
                    "is_dead": is_dead,
                    "is_inactive": is_inactive,
                    "is_duplicate": is_duplicate,
                    "details": finding_details or ["Source verified operational and reachable."]
                })

        avg_latency = int(total_latency_ms / len(sources)) if sources else 180

        # 3. Discover Potential Replacement Sources
        recommendations: List[Dict[str, Any]] = []

        # Find competitor names for better discovery
        comp_stmt = select(Competitor.name).where(Competitor.company_id == company_id)
        comp_names = list((await session.execute(comp_stmt)).scalars().all())

        try:
            discovered_replacements = await SourceDiscoveryAgent.discover_sources_for_company(
                company_name=company.name,
                company_website=company.website_url,
                industry=company.industry or "Technology",
                competitors=comp_names or ["EdTech", "Consulting"]
            )
        except Exception as e:
            logger.warning(f"Failed to discover replacement sources: {e}")
            discovered_replacements = []

        existing_urls = {SourceHealthService._normalize_url(s.url) for s in sources}
        candidate_replacements = [
            r for r in discovered_replacements
            if SourceHealthService._normalize_url(r.get("url", "")) not in existing_urls
        ]

        # Generate actionable recommendations (without auto-deleting)
        # Recommendation 1: Dead URLs
        dead_sources = [f for f in findings if f.get("is_dead")]
        if dead_sources:
            rec_replacements = candidate_replacements[:len(dead_sources)]
            recommendations.append({
                "type": "DEAD_URL_WARNING",
                "severity": "HIGH",
                "summary": f"{len(dead_sources)} dead or unreachable source URLs detected.",
                "affected_sources": [{"id": d["source_id"], "name": d["source_name"], "url": d["url"]} for d in dead_sources],
                "action_required": "Review dead sources. Founder approval required before removal.",
                "suggested_replacements": rec_replacements
            })

        # Recommendation 2: Duplicate Sources
        dup_sources = [f for f in findings if f.get("is_duplicate")]
        if dup_sources:
            recommendations.append({
                "type": "DUPLICATE_SOURCE_DETECTED",
                "severity": "MEDIUM",
                "summary": f"{len(dup_sources)} duplicate source endpoints identified in active stack.",
                "affected_sources": [{"id": d["source_id"], "name": d["source_name"], "url": d["url"]} for d in dup_sources],
                "action_required": "Consolidate duplicate feeds to optimize crawling efficiency."
            })

        # Recommendation 3: Inactive Sources
        inactive_sources = [f for f in findings if f.get("is_inactive") and not f.get("is_dead")]
        if inactive_sources:
            recommendations.append({
                "type": "INACTIVE_SOURCE_FLAG",
                "severity": "LOW",
                "summary": f"{len(inactive_sources)} sources have had no crawls in > 30 days.",
                "affected_sources": [{"id": d["source_id"], "name": d["source_name"], "url": d["url"]} for d in inactive_sources],
                "action_required": "Consider archiving or replacing low-frequency sources with active community feeds."
            })

        if not recommendations:
            recommendations.append({
                "type": "STACK_OPTIMAL",
                "severity": "INFO",
                "summary": "All intelligence sources passed reachability, deduplication, and latency thresholds.",
                "action_required": "No structural changes required this month."
            })

        report = SourceHealthReport(
            company_id=company_id,
            audit_date=now,
            total_sources=len(sources),
            healthy_count=healthy_count,
            warning_count=warning_count,
            broken_count=broken_count,
            dead_urls_count=dead_urls_count,
            duplicate_sources_count=duplicate_sources_count,
            inactive_sources_count=inactive_sources_count,
            average_latency_ms=avg_latency,
            findings=findings,
            recommendations=recommendations
        )
        session.add(report)
        await session.commit()
        await session.refresh(report)
        logger.info(f"Source health audit completed for {company.name}: {healthy_count} healthy, {dead_urls_count} dead.")
        return report

    @staticmethod
    async def list_audit_history(session: AsyncSession, company_id: str) -> List[SourceHealthReport]:
        stmt = (
            select(SourceHealthReport)
            .where(SourceHealthReport.company_id == company_id)
            .order_by(SourceHealthReport.audit_date.desc())
        )
        return list((await session.execute(stmt)).scalars().all())
