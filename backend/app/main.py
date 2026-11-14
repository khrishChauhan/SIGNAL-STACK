from contextlib import asynccontextmanager
import os
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.core.logging import setup_logging, logger
from backend.app.core.errors import SignalStackException, ResourceNotFoundError
from backend.app.db.init_db import init_db
from backend.app.services.scheduler_manager import SchedulerManager
from backend.app.api.router import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Logging, Directories, Database Init
    setup_logging("DEBUG" if settings.DEBUG else "INFO")
    logger.info(f"Starting {settings.PROJECT_NAME} v1.0.0...")
    
    # Ensure upload directory exists
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    
    # Initialize DB Schema
    await init_db()
    
    # Initialize & Start APScheduler
    scheduler_mgr = SchedulerManager.get_instance()
    scheduler_mgr.start()
    try:
        await scheduler_mgr.sync_all_jobs_from_db()
    except Exception as e:
        logger.warning(f"Could not sync scheduler jobs on startup: {e}")

    yield
    
    # Shutdown
    logger.info(f"Shutting down {settings.PROJECT_NAME}...")
    scheduler_mgr.shutdown()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.PROJECT_DESCRIPTION,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handlers
@app.exception_handler(ResourceNotFoundError)
async def resource_not_found_handler(request: Request, exc: ResourceNotFoundError):
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={
            "success": False,
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details
            }
        }
    )

@app.exception_handler(SignalStackException)
async def signal_stack_exception_handler(request: Request, exc: SignalStackException):
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "success": False,
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details
            }
        }
    )

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected server error occurred.",
                "details": str(exc) if settings.DEBUG else None
            }
        }
    )

# Mount API Router
app.include_router(api_router)

@app.get("/")
async def root():
    return {
        "name": settings.PROJECT_NAME,
        "description": settings.PROJECT_DESCRIPTION,
        "docs": "/docs",
        "api": "/api"
    }
