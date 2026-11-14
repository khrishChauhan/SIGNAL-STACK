from typing import Optional, List, Dict, Any
from pydantic import BaseModel, HttpUrl, Field, ConfigDict
from datetime import datetime

class CompanyBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Registered company name")
    website_url: str = Field(..., min_length=3, max_length=512, description="Target company website URL")
    industry: Optional[str] = Field(None, max_length=100)
    geography: Optional[str] = Field(None, max_length=100)

class CompanyCreate(CompanyBase):
    pass

class CompanyUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    website_url: Optional[str] = Field(None, min_length=3, max_length=512)
    industry: Optional[str] = Field(None, max_length=100)
    geography: Optional[str] = Field(None, max_length=100)
    onboarding_status: Optional[str] = None

class CompanyProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    company_id: str
    executive_summary: str
    value_proposition: str
    target_customer_profile: str
    business_model: str
    core_strengths: List[str] = []
    known_weaknesses: List[str] = []
    raw_research_data: Dict[str, Any] = {}
    created_at: datetime
    updated_at: datetime

class CompanyResponse(CompanyBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    onboarding_status: str
    profile: Optional[CompanyProfileResponse] = None
    created_at: datetime
    updated_at: datetime
