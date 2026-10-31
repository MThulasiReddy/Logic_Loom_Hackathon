import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .services.ml_service import MLInferenceService
from .database.seed import seed_database
from .api import (
    predict,
    transactions,
    dashboard,
    model_info,
    health,
    auth,
    payments,
    admin,
    analytics
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s"
)
logger = logging.getLogger("upi_sentinel")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Startup: load ML model once
    logger.info("Starting UPI Sentinel backend service...")
    ml_service = MLInferenceService.get_instance()
    if ml_service.is_loaded:
        logger.info(f"ML Model loaded successfully: {ml_service.metadata.get('model_name')}")
    else:
        logger.error(f"Failed to load ML Model: {ml_service.load_error}")
    
    # 2. Database migrations / seeding
    try:
        seed_database()
        logger.info("Database initialized and verified.")
        
        # Load any custom admin thresholds from database
        from .database.db import SessionLocal
        from .database.models import SystemSettings
        db = SessionLocal()
        settings = db.query(SystemSettings).first()
        if settings:
            ml_service.set_thresholds(settings.block_threshold, settings.otp_threshold)
            logger.info(f"Restored admin thresholds: block={settings.block_threshold}, otp={settings.otp_threshold}")
        db.close()
    except Exception as e:
        logger.error(f"Error initializing database: {e}")

    yield

    logger.info("Shutting down UPI Sentinel service.")

app = FastAPI(
    title="UPI Sentinel – Intelligent Fraud Detection System",
    description="Real-Time AI-Powered Digital Payment Security API. Hackathon: KLU + Path-3 ML-02.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(predict.router)
app.include_router(transactions.router)
app.include_router(dashboard.router)
app.include_router(model_info.router)
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(payments.router)
app.include_router(admin.router)
app.include_router(analytics.router)

@app.get("/")
def root():
    return {
        "system": "UPI Sentinel – Intelligent Fraud Detection System",
        "tagline": "Real-Time AI-Powered Digital Payment Security",
        "version": "1.0.0",
        "status": "operational",
        "docs_url": "/docs",
        "endpoints": {
            "predict": "/api/predict",
            "transactions": "/api/transactions",
            "dashboard_stats": "/api/dashboard/stats",
            "model_info": "/api/model/info",
            "health": "/api/health",
            "analytics": "/api/analytics/overview"
        }
    }
