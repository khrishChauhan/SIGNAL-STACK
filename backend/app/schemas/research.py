from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

class ResearchTriggerRequest(BaseModel):
    crawl_depth: int = Field(default=2, ge=1, le=5)
    force_refresh: bool = False

class ResearchStatusResponse(BaseModel):
    company_id: str
    status: str
    homepage_title: Optional[str] = None
    robots_txt_status: Optional[str] = None
    sitemap_found: bool = False
    pages_crawled_count: int = 0
    discovered_competitors: List[str] = []
    summary: Optional[str] = None
    completed_at: Optional[datetime] = None

class CompanyProfileUpdate(BaseModel):
    executive_summary: Optional[str] = None
    value_proposition: Optional[str] = None
    target_customer_profile: Optional[str] = None
    business_model: Optional[str] = None
    core_strengths: Optional[List[str]] = None
    known_weaknesses: Optional[List[str]] = None
