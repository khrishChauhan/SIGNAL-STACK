import asyncio
from typing import List, Optional, Dict, Any, Tuple
from urllib.parse import urlparse
from datetime import datetime, timezone
import feedparser
from dateutil import parser as date_parser
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from backend.app.models.source import IntelligenceSource
from backend.app.models.crawl import CrawlJob, CrawledDocument
from backend.app.services.crawler_service import CrawlerService, compute_sha256, compute_simhash
from backend.app.core.logging import logger

def parse_publication_date(entry_or_html: Any) -> Optional[datetime]:
    """Attempts to parse an authentic publication date without inventing one."""
    if isinstance(entry_or_html, dict):
        # RSS feedparser entry
        published_parsed = entry_or_html.get("published_parsed") or entry_or_html.get("updated_parsed")
        if published_parsed:
            try:
                return datetime(*published_parsed[:6], tzinfo=timezone.utc)
            except Exception:
                pass
        pub_str = entry_or_html.get("published") or entry_or_html.get("pubDate") or entry_or_html.get("updated")
        if pub_str:
            try:
                return date_parser.parse(pub_str).astimezone(timezone.utc)
            except Exception:
                pass
    return None

class WebCrawlingEngine:
    """Production web crawling engine with rate limiting, robots.txt adherence,

    content versioning, deduplication, and honest failure tracking.
    """

    @staticmethod
    async def run_crawl_cycle(
        session: AsyncSession,
        company_id: str,
        source_ids: Optional[List[str]] = None,
        force_all_approved: bool = True
    ) -> CrawlJob:
        # 1. Fetch target sources
        stmt = select(IntelligenceSource).where(IntelligenceSource.company_id == company_id)
        if source_ids:
            stmt = stmt.where(IntelligenceSource.id.in_(source_ids))
        elif force_all_approved:
            # Only crawl approved sources
            stmt = stmt.where(IntelligenceSource.approval_status.in_(["APPROVED", "CUSTOM"]))

        sources = list((await session.execute(stmt)).scalars().all())

        crawl_job = CrawlJob(
            company_id=company_id,
            status="RUNNING",
            started_at=datetime.now(timezone.utc),
            items_crawled=0,
            items_extracted=0,
            errors={}
        )
        session.add(crawl_job)
        await session.flush()

        total_crawled = 0
        total_extracted = 0
        job_errors = {}

        # Domain delay tracker for rate limiting (min 1.5s per domain)
        last_domain_request: Dict[str, float] = {}

        for source in sources:
            parsed_domain = urlparse(source.url).netloc
            now_ts = asyncio.get_event_loop().time()
            if parsed_domain in last_domain_request:
                elapsed = now_ts - last_domain_request[parsed_domain]
                if elapsed < 1.5:
                    await asyncio.sleep(1.5 - elapsed)
            last_domain_request[parsed_domain] = asyncio.get_event_loop().time()

            try:
                if source.source_type == "RSS":
                    # Parse RSS / Atom Feed
                    feed = feedparser.parse(source.url)
                    if feed.bozo and not feed.entries:
                        raise ValueError(f"Malformed or empty RSS feed: {feed.get('bozo_exception', 'Unknown parsing error')}")

                    entries = feed.entries[:10]  # Process up to 10 latest entries
                    source_extracted = 0

                    for entry in entries:
                        entry_url = entry.get("link", source.url)
                        entry_title = entry.get("title", "Untitled")
                        entry_summary = entry.get("summary", "") or entry.get("description", "")
                        clean_text = f"{entry_title}. {entry_summary}".strip()
                        pub_date = parse_publication_date(entry)

                        content_hash = compute_sha256(clean_text)
                        simhash = compute_simhash(clean_text)

                        # Check if URL already crawled
                        existing_doc_stmt = select(CrawledDocument).where(
                            CrawledDocument.company_id == company_id,
                            CrawledDocument.url == entry_url
                        )
                        existing_doc = (await session.execute(existing_doc_stmt)).scalar_one_or_none()

                        if existing_doc:
                            # Check if content changed
                            if existing_doc.content_hash != content_hash:
                                existing_doc.version += 1
                                existing_doc.previous_hash = existing_doc.content_hash
                                existing_doc.content_hash = content_hash
                                existing_doc.clean_text = clean_text
                                existing_doc.has_changed = True
                                existing_doc.crawled_at = datetime.now(timezone.utc)
                                total_extracted += 1
                        else:
                            # New unique document
                            doc = CrawledDocument(
                                company_id=company_id,
                                source_id=source.id,
                                crawl_job_id=crawl_job.id,
                                url=entry_url,
                                canonical_url=entry_url,
                                title=entry_title,
                                clean_text=clean_text,
                                author=entry.get("author"),
                                content_hash=content_hash,
                                simhash=simhash,
                                version=1,
                                has_changed=False,
                                published_at=pub_date,
                                crawled_at=datetime.now(timezone.utc)
                            )
                            session.add(doc)
                            total_extracted += 1

                        total_crawled += 1

                else:
                    # Webpage Crawl
                    html, status_code, err = await CrawlerService.fetch_page(source.url)
                    if err or not html:
                        source.consecutive_failures += 1
                        if source.consecutive_failures >= 3:
                            source.health_status = "WARNING"
                        if source.consecutive_failures >= 5:
                            source.health_status = "BROKEN"
                        job_errors[source.name] = err or f"HTTP {status_code}"
                        continue

                    extracted = CrawlerService.extract_content(html, source.url)
                    content_hash = extracted["content_hash"]
                    simhash = extracted["simhash"]

                    # Check for revisions or existing
                    existing_doc_stmt = select(CrawledDocument).where(
                        CrawledDocument.company_id == company_id,
                        CrawledDocument.url == source.url
                    )
                    existing_doc = (await session.execute(existing_doc_stmt)).scalar_one_or_none()

                    if existing_doc:
                        if existing_doc.content_hash != content_hash:
                            existing_doc.version += 1
                            existing_doc.previous_hash = existing_doc.content_hash
                            existing_doc.content_hash = content_hash
                            existing_doc.clean_text = extracted["clean_text"]
                            existing_doc.has_changed = True
                            existing_doc.crawled_at = datetime.now(timezone.utc)
                            total_extracted += 1
                    else:
                        doc = CrawledDocument(
                            company_id=company_id,
                            source_id=source.id,
                            crawl_job_id=crawl_job.id,
                            url=source.url,
                            canonical_url=source.url,
                            title=extracted["title"],
                            clean_text=extracted["clean_text"],
                            author=extracted["author"],
                            content_hash=content_hash,
                            simhash=simhash,
                            version=1,
                            has_changed=False,
                            published_at=None,  # Never invent publication date
                            crawled_at=datetime.now(timezone.utc)
                        )
                        session.add(doc)
                        total_extracted += 1

                    total_crawled += 1

                # Update source success tracking
                source.last_crawled_at = datetime.now(timezone.utc)
                source.last_success_at = datetime.now(timezone.utc)
                source.consecutive_failures = 0
                source.health_status = "HEALTHY"

            except Exception as e:
                logger.error(f"Crawling failed for {source.name} ({source.url}): {e}")
                source.consecutive_failures += 1
                job_errors[source.name] = str(e)

        crawl_job.status = "COMPLETED"
        crawl_job.completed_at = datetime.now(timezone.utc)
        crawl_job.items_crawled = total_crawled
        crawl_job.items_extracted = total_extracted
        crawl_job.errors = job_errors

        await session.commit()
        await session.refresh(crawl_job)
        return crawl_job
