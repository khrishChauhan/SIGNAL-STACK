import hashlib
import re
from typing import Optional, Dict, Any, Tuple
from urllib.parse import urlparse, urljoin
import urllib.robotparser
from datetime import datetime, timezone
import httpx
from bs4 import BeautifulSoup
import trafilatura
from backend.app.core.config import settings
from backend.app.core.logging import logger

def compute_sha256(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()

def compute_simhash(text: str) -> str:
    """Generates a 64-bit SimHash hex string for near-duplicate text detection."""
    tokens = re.findall(r"\w+", text.lower())
    if not tokens:
        return "0" * 16
    v = [0] * 64
    for token in tokens:
        token_hash = int(hashlib.md5(token.encode("utf-8")).hexdigest(), 16)
        for i in range(64):
            bit = (token_hash >> i) & 1
            v[i] += 1 if bit == 1 else -1
    fingerprint = 0
    for i in range(64):
        if v[i] > 0:
            fingerprint |= 1 << i
    return f"{fingerprint:016x}"

class CrawlerService:
    @staticmethod
    async def check_robots_allowed(url: str) -> bool:
        """Inspects domain robots.txt to respect website scraping permissions."""
        try:
            parsed = urlparse(url)
            robots_url = f"{parsed.scheme}://{parsed.netloc}/robots.txt"
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(robots_url, headers={"User-Agent": settings.CRAWLER_USER_AGENT})
                if resp.status_code == 200:
                    rp = urllib.robotparser.RobotFileParser()
                    rp.parse(resp.text.splitlines())
                    return rp.can_fetch(settings.CRAWLER_USER_AGENT, url)
                # If robots.txt returns 404 or 403, standard convention allows crawling public pages
                return True
        except Exception as e:
            logger.debug(f"robots.txt check skipped/failed for {url}: {e}")
            return True

    @staticmethod
    async def fetch_page(url: str) -> Tuple[Optional[str], Optional[int], Optional[str]]:
        """Fetches page HTML with custom headers and error handling.

        Returns (html, status_code, error_message).
        """
        allowed = await CrawlerService.check_robots_allowed(url)
        if not allowed:
            return None, 403, "Crawl disallowed by robots.txt"

        headers = {
            "User-Agent": settings.CRAWLER_USER_AGENT,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5"
        }

        try:
            async with httpx.AsyncClient(
                timeout=float(settings.CRAWLER_TIMEOUT_SECONDS),
                follow_redirects=True
            ) as client:
                res = await client.get(url, headers=headers)
                return res.text, res.status_code, None
        except httpx.TimeoutException:
            return None, 408, "Request timed out"
        except httpx.ConnectError:
            return None, 502, "Failed to connect to host"
        except Exception as e:
            return None, 500, f"Crawl error: {str(e)}"

    @staticmethod
    def extract_content(html: str, url: str) -> Dict[str, Any]:
        """Extracts clean article text, metadata, title, author, and hashes from HTML."""
        soup = BeautifulSoup(html, "html.parser")

        # Title extraction
        title = ""
        if soup.title and soup.title.string:
            title = soup.title.string.strip()
        elif soup.find("meta", property="og:title"):
            title = soup.find("meta", property="og:title").get("content", "").strip()

        # Meta description
        meta_desc = ""
        desc_tag = soup.find("meta", attrs={"name": "description"}) or soup.find("meta", property="og:description")
        if desc_tag and desc_tag.get("content"):
            meta_desc = desc_tag.get("content").strip()

        # Author
        author = None
        author_tag = soup.find("meta", attrs={"name": "author"})
        if author_tag and author_tag.get("content"):
            author = author_tag.get("content").strip()

        # Trafilatura clean extraction
        clean_text = trafilatura.extract(
            html,
            url=url,
            include_comments=False,
            include_tables=True,
            favor_recall=True
        )

        # Fallback if trafilatura recall was empty
        if not clean_text or len(clean_text) < 50:
            for tag in soup(["script", "style", "nav", "footer", "header", "noscript"]):
                tag.decompose()
            clean_text = " ".join(soup.stripped_strings)

        # Truncate clean text if absurdly large
        clean_text = clean_text[:50000] if clean_text else meta_desc or title

        content_hash = compute_sha256(clean_text)
        simhash = compute_simhash(clean_text)

        return {
            "title": title or "Untitled Document",
            "meta_description": meta_desc,
            "clean_text": clean_text,
            "author": author,
            "content_hash": content_hash,
            "simhash": simhash
        }
