from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.db.session import get_db
from backend.app.services.company_service import CompanyService
from backend.app.schemas.company import CompanyCreate, CompanyUpdate, CompanyResponse, CompanyProfileResponse
from backend.app.schemas.common import APIResponse, PaginatedResponse, PaginationMeta

router = APIRouter(prefix="/companies", tags=["Companies"])

@router.post("", response_model=APIResponse[CompanyResponse], status_code=status.HTTP_201_CREATED)
async def create_company(
    data: CompanyCreate,
    session: AsyncSession = Depends(get_db)
):
    """Registers a new target company for intelligence monitoring."""
    company = await CompanyService.create_company(session, data)
    return APIResponse(data=company, message=f"Company '{company.name}' registered successfully.")

@router.get("", response_model=PaginatedResponse[CompanyResponse])
async def list_companies(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    session: AsyncSession = Depends(get_db)
):
    """Lists registered companies with pagination."""
    companies, total = await CompanyService.list_companies(session, page, limit)
    total_pages = max(1, (total + limit - 1) // limit)
    return PaginatedResponse(
        data=companies,
        pagination=PaginationMeta(total=total, page=page, limit=limit, total_pages=total_pages)
    )

@router.get("/{id}", response_model=APIResponse[CompanyResponse])
async def get_company(
    id: str,
    session: AsyncSession = Depends(get_db)
):
    """Fetches details for a single company by ID."""
    company = await CompanyService.get_company(session, id)
    return APIResponse(data=company)

@router.put("/{id}", response_model=APIResponse[CompanyResponse])
async def update_company(
    id: str,
    data: CompanyUpdate,
    session: AsyncSession = Depends(get_db)
):
    """Updates company metadata or onboarding status."""
    company = await CompanyService.update_company(session, id, data)
    return APIResponse(data=company, message="Company updated successfully.")

@router.get("/{id}/profile", response_model=APIResponse[CompanyProfileResponse])
async def get_company_profile(
    id: str,
    session: AsyncSession = Depends(get_db)
):
    """Fetches AI-generated company profile."""
    profile = await CompanyService.get_company_profile(session, id)
    return APIResponse(data=profile)
