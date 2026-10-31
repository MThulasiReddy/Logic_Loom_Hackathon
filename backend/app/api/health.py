from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from ..database.db import get_db
from ..services.ml_service import MLInferenceService

router = APIRouter(prefix="/api", tags=["Health"])

@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    ml_service = MLInferenceService.get_instance()
    
    # Check DB connectivity
    db_status = "healthy"
    db_error = None
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = "unhealthy"
        db_error = str(e)

    model_status = "healthy" if ml_service.is_loaded else "unhealthy"

    overall_status = "healthy" if (db_status == "healthy" and model_status == "healthy") else "degraded"

    return {
        "status": overall_status,
        "timestamp": datetime.utcnow().isoformat(),
        "database": {
            "status": db_status,
            "error": db_error
        },
        "ml_model": {
            "status": model_status,
            "name": ml_service.metadata.get("model_name", "Extra Trees"),
            "error": ml_service.load_error
        },
        "system": "UPI Sentinel – Intelligent Fraud Detection System"
    }
