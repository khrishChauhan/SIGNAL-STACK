from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime

class CrawlTriggerRequest(BaseModel):
    source_ids: Optional[List[str]] = None
    force_all_approved: bool = True

class CrawlJobResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    company_id: str
    source_id: Optional[str] = None
    status: str
    items_crawled: int
    items_extracted: int
    errors: Optional[Dict[str, Any]] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime

class CrawledDocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    company_id: str
    source_id: Optional[str] = None
    crawl_job_id: Optional[str] = None
    url: str
    canonical_url: Optional[str] = None
    title: str
    clean_text: str
    author: Optional[str] = None
    content_hash: str
    simhash: Optional[str] = None
    published_at: Optional[datetime] = None
    crawled_at: datetime
