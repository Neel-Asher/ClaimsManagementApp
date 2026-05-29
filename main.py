"""
main.py
=======
InsuranceIQ Intelligence Service — FastAPI Application Entry Point.

This is the main module that:
    - Creates and configures the FastAPI application
    - Registers all API routers (fraud, ETL, analytics)
    - Sets up CORS middleware for React/Spring Boot integration
    - Initializes the database on startup
    - Provides a health check endpoint

Run with:
    uvicorn main:app --reload --host 0.0.0.0 --port 8000

API Documentation:
    Swagger UI:  http://localhost:8000/docs
    ReDoc:       http://localhost:8000/redoc

Architecture:
    React Frontend  →  Spring Boot  →  THIS SERVICE (FastAPI)
                                         ├── /predict/fraud/{id}
                                         ├── /etl/process
                                         └── /analytics/*
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import get_settings
from models.database import create_tables
from models.schemas import HealthResponse

# ── Configure logging ──────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════════
#  APPLICATION LIFESPAN (startup / shutdown)
# ═══════════════════════════════════════════════════════════════


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.

    Startup:
        - Create database tables if they don't exist
        - Log configuration summary

    Shutdown:
        - Clean up resources (if any)
    """
    settings = get_settings()

    # ── Startup ────────────────────────────────────────────────
    logger.info("=" * 60)
    logger.info("  %s v%s", settings.APP_NAME, settings.APP_VERSION)
    logger.info("=" * 60)
    logger.info("  Database:     %s", settings.DATABASE_URL)
    logger.info("  Fraud Mode:   %s", settings.FRAUD_DETECTION_MODE.value)
    logger.info("  CORS Origins: %s", settings.cors_origin_list)
    logger.info("  Debug:        %s", settings.DEBUG)
    logger.info("=" * 60)

    # Create database tables
    create_tables()
    logger.info("Database tables initialized.")

    yield  # Application runs here

    # ── Shutdown ───────────────────────────────────────────────
    logger.info("Shutting down %s.", settings.APP_NAME)


# ═══════════════════════════════════════════════════════════════
#  CREATE FASTAPI APP
# ═══════════════════════════════════════════════════════════════

settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "AI-powered Intelligence & ML microservice for the InsuranceIQ platform. "
        "Provides fraud detection, ETL processing, and analytics APIs."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)


# ═══════════════════════════════════════════════════════════════
#  MIDDLEWARE
# ═══════════════════════════════════════════════════════════════

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ═══════════════════════════════════════════════════════════════
#  REGISTER ROUTERS
# ═══════════════════════════════════════════════════════════════

from routers.fraud_router import router as fraud_router
from routers.etl_router import router as etl_router
from routers.analytics_router import router as analytics_router

app.include_router(fraud_router)
app.include_router(etl_router)
app.include_router(analytics_router)


# ═══════════════════════════════════════════════════════════════
#  HEALTH CHECK ENDPOINT
# ═══════════════════════════════════════════════════════════════


@app.get(
    "/",
    response_model=HealthResponse,
    tags=["Health"],
    summary="Service health check",
    description="Returns the service status, version, and configuration.",
)
def health_check():
    """
    Root endpoint — health check for monitoring and load balancers.

    Returns:
        Service status, version, fraud detection mode, and DB status.
    """
    return HealthResponse(
        status="healthy",
        service=settings.APP_NAME,
        version=settings.APP_VERSION,
        fraud_detection_mode=settings.FRAUD_DETECTION_MODE.value,
        database="connected",
    )


@app.get(
    "/health",
    response_model=HealthResponse,
    tags=["Health"],
    summary="Health check (alias)",
)
def health_check_alias():
    """Alias for root health check — commonly used by cloud load balancers."""
    return health_check()


# ═══════════════════════════════════════════════════════════════
#  DIRECT RUN (for development)
# ═══════════════════════════════════════════════════════════════


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )