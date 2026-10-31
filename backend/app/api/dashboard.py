from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database.db import get_db
from ..database.models import TransactionPrediction, User
from ..schemas.transaction import DashboardStats, TransactionDetail
from ..services.auth_service import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    base_query = db.query(TransactionPrediction)

    # Scoping: If user is not an admin, ONLY show transactions related to this user!
    if not current_user or current_user.role != "admin":
        if current_user:
            base_query = base_query.filter(TransactionPrediction.user_id == current_user.id)
        else:
            # Unauthenticated fallback: show empty
            base_query = base_query.filter(TransactionPrediction.id == -1)

    total = base_query.count()

    approved_count = base_query.filter(
        TransactionPrediction.decision == "APPROVE"
    ).count()

    otp_count = base_query.filter(
        TransactionPrediction.decision == "STEP_UP_OTP"
    ).count()

    blocked_count = base_query.filter(
        TransactionPrediction.decision == "BLOCK"
    ).count()

    pending_admin_reviews = base_query.filter(
        TransactionPrediction.status == "PENDING_ADMIN_REVIEW"
    ).count()

    # Averages and totals
    avg_fraud_prob_res = base_query.with_entities(func.avg(TransactionPrediction.fraud_probability)).scalar() or 0.0
    total_volume_res = base_query.with_entities(func.sum(TransactionPrediction.amount_inr)).scalar() or 0.0

    high_risk_count = base_query.filter(
        TransactionPrediction.fraud_probability >= 0.2855
    ).count()
    high_risk_pct = round((high_risk_count / total * 100), 2) if total > 0 else 0.0

    # Risk distribution tiers: Low (<15%), Moderate (15-28.5%), Elevated (28.5-57.1%), High (>=57.1%)
    tier_low = base_query.filter(TransactionPrediction.fraud_probability < 0.15).count()
    tier_moderate = base_query.filter(
        TransactionPrediction.fraud_probability >= 0.15,
        TransactionPrediction.fraud_probability < 0.2855
    ).count()
    tier_elevated = base_query.filter(
        TransactionPrediction.fraud_probability >= 0.2855,
        TransactionPrediction.fraud_probability < 0.571
    ).count()
    tier_high = base_query.filter(TransactionPrediction.fraud_probability >= 0.571).count()

    risk_dist = {
        "Low (<15%)": tier_low,
        "Moderate (15-28.5%)": tier_moderate,
        "Elevated (28.5-57.1%)": tier_elevated,
        "High (>=57.1%)": tier_high
    }

    # Recent suspicious transactions
    recent_suspicious = base_query.filter(
        TransactionPrediction.decision.in_(["STEP_UP_OTP", "BLOCK"])
    ).order_by(TransactionPrediction.created_at.desc()).limit(6).all()

    return DashboardStats(
        total_transactions=total,
        approved_transactions=approved_count,
        otp_challenges=otp_count,
        blocked_transactions=blocked_count,
        pending_admin_reviews=pending_admin_reviews,
        avg_fraud_probability=round(float(avg_fraud_prob_res), 4),
        high_risk_percentage=high_risk_pct,
        total_volume_inr=round(float(total_volume_res), 2),
        risk_distribution=risk_dist,
        recent_suspicious=[TransactionDetail.model_validate(t) for t in recent_suspicious]
    )
