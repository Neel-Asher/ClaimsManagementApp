"""
routers/etl_router.py
======================
ETL pipeline API endpoint.

Exposes:
    POST /etl/process — Trigger ETL pipeline on CSV data

Called by Spring Boot when an admin uploads CSV files, or
manually triggered to load sample data into the database.
"""

import logging
import os

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from config import get_settings
from models.database import get_db
from models.schemas import ETLProcessRequest, ETLProcessResponse
from services.etl_service import ETLPipeline

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/etl",
    tags=["ETL Pipeline"],
    responses={
        200: {"description": "ETL processing result"},
        400: {"description": "Invalid request"},
    },
)


# ═══════════════════════════════════════════════════════════════
#  ENDPOINTS
# ═══════════════════════════════════════════════════════════════


@router.post(
    "/process",
    response_model=ETLProcessResponse,
    summary="Run ETL pipeline",
    description="""
    Execute the ETL (Extract, Transform, Load) pipeline.

    **Source Types:**
    - `sample` — Process built-in sample CSV datasets (claims, policies, agents)
    - `upload` — Process a user-uploaded CSV file

    **Pipeline Steps:**
    1. Extract: Read CSV data
    2. Transform: Clean, normalize, derive features, compute fraud scores
    3. Load: Write processed records to the database

    **Idempotent:** Running multiple times replaces existing data.
    """,
)
def process_data(
    request: ETLProcessRequest,
    db: Session = Depends(get_db),
):
    """
    Trigger the ETL pipeline.

    Args:
        request: ETL configuration (source type and optional file path).
        db: Database session (injected by FastAPI).

    Returns:
        ETLProcessResponse with processing stats and summary.
    """
    logger.info("ETL triggered: source=%s", request.source_type)

    # ── Validate upload path if specified ──────────────────────
    if request.source_type == "upload" and request.file_path:
        if not os.path.exists(request.file_path):
            raise HTTPException(
                status_code=400,
                detail=f"Upload file not found: {request.file_path}",
            )

    try:
        pipeline = ETLPipeline(db)
        result = pipeline.run(
            source_type=request.source_type,
            file_path=request.file_path,
        )

        return ETLProcessResponse(**result)

    except Exception as e:
        logger.error("ETL pipeline failed: %s", str(e))
        raise HTTPException(
            status_code=500,
            detail=f"ETL pipeline failed: {str(e)}",
        )


@router.post(
    "/upload",
    response_model=ETLProcessResponse,
    summary="Upload CSV and run ETL",
    description="""
    Upload a CSV file and process it through the ETL pipeline.

    The file is saved to the uploads directory and then processed.
    Auto-detects the dataset type (claims, policies, agents) from column names.
    """,
)
async def upload_and_process(
    file: UploadFile = File(..., description="CSV file to process"),
    db: Session = Depends(get_db),
):
    """
    Upload a CSV file and immediately process it via ETL.

    Args:
        file: The uploaded CSV file.
        db: Database session (injected by FastAPI).

    Returns:
        ETLProcessResponse with processing stats.
    """
    # ── Validate file type ─────────────────────────────────────
    if not file.filename.endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Only CSV files are supported. Please upload a .csv file.",
        )

    # ── Save uploaded file ─────────────────────────────────────
    settings = get_settings()
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    upload_path = os.path.join(settings.UPLOAD_DIR, file.filename)

    try:
        content = await file.read()
        with open(upload_path, "wb") as f:
            f.write(content)
        logger.info("File uploaded: %s (%d bytes)", upload_path, len(content))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save uploaded file: {str(e)}",
        )

    # ── Run ETL on uploaded file ───────────────────────────────
    try:
        pipeline = ETLPipeline(db)
        result = pipeline.run(source_type="upload", file_path=upload_path)
        return ETLProcessResponse(**result)

    except Exception as e:
        logger.error("ETL failed for uploaded file: %s", str(e))
        raise HTTPException(
            status_code=500,
            detail=f"ETL processing failed: {str(e)}",
        )


@router.get(
    "/status",
    summary="Get ETL pipeline status",
    description="Returns information about the last ETL run and data availability.",
)
def get_etl_status(db: Session = Depends(get_db)):
    """
    Check ETL status — how many records are loaded in each table.

    Returns:
        Record counts for each processed data table.
    """
    from models.database import ProcessedAgent, ProcessedClaim, ProcessedPolicy

    claims_count = db.query(ProcessedClaim).count()
    policies_count = db.query(ProcessedPolicy).count()
    agents_count = db.query(ProcessedAgent).count()

    return {
        "status": "ready" if claims_count > 0 else "empty",
        "tables": {
            "processed_claims": claims_count,
            "processed_policies": policies_count,
            "processed_agents": agents_count,
        },
        "message": (
            f"Database loaded with {claims_count} claims, "
            f"{policies_count} policies, {agents_count} agents."
            if claims_count > 0
            else "No data loaded. Run POST /etl/process to load sample data."
        ),
    }
