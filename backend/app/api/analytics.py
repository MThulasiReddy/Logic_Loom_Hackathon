from collections import defaultdict
from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, case

from ..database.db import get_db
from ..database.models import TransactionPrediction, User
from ..services.auth_service import get_current_user

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.get("/overview")
def get_analytics_overview(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    base_query = db.query(TransactionPrediction)
    if not current_user or current_user.role != "admin":
        if current_user:
            base_query = base_query.filter(TransactionPrediction.user_id == current_user.id)
        else:
            base_query = base_query.filter(TransactionPrediction.id == -1)

    total_txns = base_query.count()

    # 1. Decision distribution
    decisions_raw = base_query.with_entities(
        TransactionPrediction.decision,
        func.count(TransactionPrediction.id)
    ).group_by(TransactionPrediction.decision).all()
    decision_dist = {d: c for d, c in decisions_raw}

    # 2. Risk by transaction type
    type_stats_raw = base_query.with_entities(
        TransactionPrediction.transaction_type,
        func.count(TransactionPrediction.id).label("total"),
        func.avg(TransactionPrediction.risk_percentage).label("avg_risk"),
        func.sum(case((TransactionPrediction.decision.in_(["STEP_UP_OTP", "BLOCK"]), 1), else_=0)).label("suspicious_count")
    ).group_by(TransactionPrediction.transaction_type).all()

    type_analysis = [
        {
            "transaction_type": row[0],
            "total_count": row[1],
            "avg_risk": round(float(row[2] or 0), 2),
            "suspicious_count": int(row[3] or 0)
        }
        for row in type_stats_raw
    ]

    # 3. Risk by merchant category
    merchant_stats_raw = base_query.with_entities(
        TransactionPrediction.merchant_category,
        func.count(TransactionPrediction.id).label("total"),
        func.avg(TransactionPrediction.risk_percentage).label("avg_risk"),
        func.sum(case((TransactionPrediction.decision == "BLOCK", 1), else_=0)).label("blocked_count")
    ).group_by(TransactionPrediction.merchant_category).all()

    merchant_analysis = [
        {
            "merchant_category": row[0],
            "total_count": row[1],
            "avg_risk": round(float(row[2] or 0), 2),
            "blocked_count": int(row[3] or 0)
        }
        for row in merchant_stats_raw
    ]

    # 4. Amount band distribution
    bands = [
        ("< ₹1,000", 0, 1000),
        ("₹1,000 - ₹10,000", 1000, 10000),
        ("₹10,000 - ₹50,000", 10000, 50000),
        ("> ₹50,000", 50000, 10000000)
    ]
    amount_analysis = []
    for label, min_val, max_val in bands:
        q = base_query.filter(
            TransactionPrediction.amount_inr >= min_val,
            TransactionPrediction.amount_inr < max_val
        ).with_entities(
            func.count(TransactionPrediction.id),
            func.avg(TransactionPrediction.risk_percentage),
            func.sum(case((TransactionPrediction.decision != "APPROVE", 1), else_=0))
        ).first()

        amount_analysis.append({
            "tier": label,
            "count": q[0] or 0 if q else 0,
            "avg_risk": round(float(q[1] or 0), 2) if q and q[1] is not None else 0.0,
            "flagged": int(q[2] or 0) if q and q[2] is not None else 0
        })

    # 5. Hourly fraud patterns
    all_txns = base_query.with_entities(
        TransactionPrediction.created_at,
        TransactionPrediction.decision,
        TransactionPrediction.risk_percentage
    ).all()

    hourly_dict = defaultdict(lambda: {"total": 0, "flagged": 0, "avg_risk_sum": 0.0})
    for t in all_txns:
        hr = t[0].hour
        hourly_dict[hr]["total"] += 1
        hourly_dict[hr]["avg_risk_sum"] += t[2]
        if t[1] != "APPROVE":
            hourly_dict[hr]["flagged"] += 1

    hourly_patterns = []
    for hr in range(24):
        hdata = hourly_dict[hr]
        avg_risk = round(hdata["avg_risk_sum"] / hdata["total"], 2) if hdata["total"] > 0 else 0.0
        hourly_patterns.append({
            "hour": f"{hr:02d}:00",
            "total_transactions": hdata["total"],
            "flagged_transactions": hdata["flagged"],
            "avg_risk": avg_risk
        })

    return {
        "total_transactions": total_txns,
        "decision_distribution": {
            "APPROVE": decision_dist.get("APPROVE", 0),
            "STEP_UP_OTP": decision_dist.get("STEP_UP_OTP", 0),
            "BLOCK": decision_dist.get("BLOCK", 0)
        },
        "type_analysis": type_analysis,
        "merchant_analysis": merchant_analysis,
        "amount_analysis": amount_analysis,
        "hourly_patterns": hourly_patterns
    }
