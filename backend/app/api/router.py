from fastapi import APIRouter
from backend.app.api.endpoints import (
    companies,
    research,
    interviews,
    sources,
    monitoring,
    intelligence,
    briefs,
    documents,
    scheduling
)

api_router = APIRouter(prefix="/api")

# Register domain sub-routers
api_router.include_router(companies.router)
api_router.include_router(research.router)
api_router.include_router(interviews.router)
api_router.include_router(sources.router)
api_router.include_router(monitoring.router)
api_router.include_router(intelligence.router)
api_router.include_router(briefs.router)
api_router.include_router(documents.router)
api_router.include_router(scheduling.router)
