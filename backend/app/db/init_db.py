from backend.app.db.session import engine, AsyncSessionLocal
from backend.app.db.base import Base
import backend.app.models  # Ensures all models are registered on Base.metadata
from backend.app.db.seed import seed_initial_demo_data
from backend.app.core.logging import logger

async def init_db() -> None:
    """Create all tables asynchronously if they don't already exist and seed demo data."""
    logger.info("Initializing database schema...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database schema initialized successfully.")

    async with AsyncSessionLocal() as session:
        await seed_initial_demo_data(session)
