from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database.db import get_db
from ..database.models import User, TransactionPrediction, Notification, SystemSettings
from ..schemas.user import AdminReviewRequest, ThresholdUpdateRequest
from ..schemas.transaction import TransactionDetail
from ..services.auth_service import require_admin
from ..services.ml_service import MLInferenceService
from ..utils.timezone import get_ist_now, format_ist

router = APIRouter(prefix="/api/admin", tags=["Admin Portal"])

@router.get("/thresholds")
def get_thresholds(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    ml_service = MLInferenceService.get_instance()
    # Check DB settings
    settings = db.query(SystemSettings).first()
    if settings:
        ml_service.set_thresholds(settings.block_threshold, settings.otp_threshold)
    
    current = ml_service.get_current_thresholds()
    return {
        "block_threshold": current["block_threshold"],
        "otp_threshold": current["otp_threshold_provisional"],
        "is_customized": current["is_customized"],
        "note": "Manually adjustable fraud decision cutoffs configured by Security Admin"
    }

@router.post("/thresholds")
def update_thresholds(
    payload: ThresholdUpdateRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    if payload.otp_threshold >= payload.block_threshold:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Step-Up OTP Threshold must be strictly less than the Block Threshold."
        )

    # Save to database
    settings = db.query(SystemSettings).first()
    now_ist = get_ist_now()
    if not settings:
        settings = SystemSettings(
            block_threshold=payload.block_threshold,
            otp_threshold=payload.otp_threshold,
            updated_at=now_ist
        )
        db.add(settings)
    else:
        settings.block_threshold = payload.block_threshold
        settings.otp_threshold = payload.otp_threshold
        settings.updated_at = now_ist

    db.commit()

    # Update runtime ML Inference service
    ml_service = MLInferenceService.get_instance()
    ml_service.set_thresholds(payload.block_threshold, payload.otp_threshold)

    return {
        "success": True,
        "message": "Fraud decision thresholds updated successfully by Admin.",
        "block_threshold": payload.block_threshold,
        "otp_threshold": payload.otp_threshold,
        "updated_at": settings.updated_at
    }

@router.get("/pending-reviews")
def get_pending_reviews(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    pending = db.query(TransactionPrediction).filter(
        TransactionPrediction.status.in_(["PENDING_ADMIN_REVIEW", "PENDING_OTP", "BLOCKED"])
    ).order_by(TransactionPrediction.created_at.desc()).all()

    return {
        "count": len(pending),
        "items": [TransactionDetail.model_validate(p) for p in pending]
    }

@router.post("/review")
def review_transaction(
    payload: AdminReviewRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    tx = db.query(TransactionPrediction).filter(
        TransactionPrediction.id == payload.transaction_id
    ).first()

    if not tx:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transaction #{payload.transaction_id} not found."
        )

    action = payload.action.upper()
    if action not in ["APPROVE", "REJECT"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Action must be either 'APPROVE' or 'REJECT'."
        )

    if action == "APPROVE":
        # Deduct from payer & credit receiver
        if tx.user_id:
            payer = db.query(User).filter(User.id == tx.user_id).first()
            if payer:
                if payer.wallet_balance >= tx.amount_inr:
                    payer.wallet_balance -= tx.amount_inr
                else:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Payer wallet has insufficient funds (₹{payer.wallet_balance}) for ₹{tx.amount_inr}."
                    )
        
        # Credit receiver
        receiver = db.query(User).filter(User.upi_id == tx.receiver_upi_id).first()
        if receiver:
            receiver.wallet_balance += tx.amount_inr

        tx.status = "ADMIN_APPROVED"
        tx.admin_notes = payload.admin_notes or f"Manually verified and cleared by Security Admin {admin.full_name}."
    else: # REJECT
        tx.status = "ADMIN_REJECTED"
        tx.admin_notes = payload.admin_notes or f"Payment blocked and rejected by Security Admin {admin.full_name} due to elevated fraud risk."

    db.commit()
    db.refresh(tx)

    return {
        "success": True,
        "action": action,
        "transaction_id": tx.id,
        "status": tx.status,
        "admin_notes": tx.admin_notes,
        "updated_at": format_ist(get_ist_now())
    }

@router.get("/notifications")
def get_notifications(
    limit: int = 20,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    notifs = db.query(Notification).order_by(
        Notification.created_at.desc()
    ).limit(limit).all()

    unread_count = db.query(Notification).filter(Notification.is_read == False).count()

    return {
        "unread_count": unread_count,
        "items": [
            {
                "id": n.id,
                "title": n.title,
                "message": n.message,
                "severity": n.severity,
                "transaction_id": n.transaction_id,
                "is_read": n.is_read,
                "created_at": format_ist(n.created_at)
            }
            for n in notifs
        ]
    }

@router.post("/notifications/{notif_id}/read")
def mark_notification_read(
    notif_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    notif = db.query(Notification).filter(Notification.id == notif_id).first()
    if notif:
        notif.is_read = True
        db.commit()
    return {"success": True}

@router.post("/notifications/mark-all-read")
def mark_all_read(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    db.query(Notification).filter(Notification.is_read == False).update({"is_read": True})
    db.commit()
    return {"success": True}
