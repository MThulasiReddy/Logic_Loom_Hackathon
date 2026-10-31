import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database.db import get_db
from ..database.models import TransactionPrediction, Notification, User
from ..schemas.transaction import PredictionRequest, PredictionResponse
from ..services.ml_service import MLInferenceService
from ..services.auth_service import get_current_user
from ..utils.timezone import get_ist_now

router = APIRouter(prefix="/api", tags=["Prediction"])

@router.post("/predict", response_model=PredictionResponse)
def predict_transaction(
    payload: PredictionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ml_service = MLInferenceService.get_instance()
    if not ml_service.is_loaded:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"ML Model service unavailable: {ml_service.load_error or 'Artifacts not loaded'}"
        )

    # Generate reference if not supplied
    ist_now = get_ist_now()
    ref = payload.transaction_reference
    if not ref:
        ref = f"UPI-{ist_now.strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6].upper()}"

    # Check for duplicate transaction reference
    existing = db.query(TransactionPrediction).filter(
        TransactionPrediction.transaction_reference == ref
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Transaction reference '{ref}' already exists in the system."
        )

    # ML Inference
    try:
        dict_payload = payload.model_dump()
        result = ml_service.predict(dict_payload)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Inference failed: {str(e)}"
        )

    geo_info = result.get("geo_info", {})
    # Persist in Database
    record = TransactionPrediction(
        transaction_reference=ref,
        transaction_type=payload.transaction_type,
        merchant_category=payload.merchant_category,
        amount_inr=payload.amount_inr,
        sender_upi_id=payload.sender_upi_id or (current_user.upi_id if current_user else None),
        receiver_upi_id=payload.receiver_upi_id,
        sender_bank=payload.sender_bank,
        receiver_bank=payload.receiver_bank,
        sender_state=payload.sender_state,
        sender_age_group=payload.sender_age_group,
        receiver_age_group=payload.receiver_age_group,
        device_type=payload.device_type,
        network_type=payload.network_type,
        ip_address=geo_info.get("ip") or payload.ip_address or payload.client_ip,
        location_country=geo_info.get("country", "India"),
        is_international=bool(geo_info.get("is_international", False)),
        fraud_probability=result["fraud_probability"],
        risk_percentage=result["risk_percentage"],
        decision=result["decision"],
        status=result["status"],
        explanation=result["explanation"],
        model_name=result["model_name"],
        created_at=ist_now,
        user_id=current_user.id if current_user else None
    )

    db.add(record)
    db.commit()
    db.refresh(record)

    # If flagged as risky (STEP_UP_OTP or BLOCK), automatically trigger admin notification
    if result["decision"] in ["STEP_UP_OTP", "BLOCK"]:
        severity = "high" if result["decision"] == "BLOCK" else "medium"
        notif = Notification(
            title=f"Suspicious Transaction: {ref}",
            message=f"{result['decision']} alert triggered on ₹{payload.amount_inr:,.2f} transfer. Risk: {result['risk_percentage']}%.",
            severity=severity,
            transaction_id=record.id,
            is_read=False,
            created_at=ist_now
        )
        db.add(notif)
        db.commit()

    return PredictionResponse(
        id=record.id,
        transaction_reference=record.transaction_reference,
        transaction_type=record.transaction_type,
        merchant_category=record.merchant_category,
        amount_inr=record.amount_inr,
        fraud_probability=record.fraud_probability,
        risk_percentage=record.risk_percentage,
        decision=record.decision,
        status=record.status,
        explanation=record.explanation or "",
        model_name=record.model_name,
        thresholds=result["thresholds"],
        ip_address=record.ip_address,
        location_country=record.location_country,
        is_international=record.is_international,
        created_at=record.created_at
    )
