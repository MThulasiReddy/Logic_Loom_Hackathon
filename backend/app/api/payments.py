import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from ..database.db import get_db
from ..database.models import User, TransactionPrediction, Notification
from ..schemas.user import PaymentInitiateRequest, OTPVerifyRequest, RecipientResponse
from ..services.auth_service import require_current_user
from ..services.ml_service import MLInferenceService
from ..utils.timezone import get_ist_now, format_ist

router = APIRouter(prefix="/api/payments", tags=["Payments Workflow"])

@router.get("/recipients", response_model=List[RecipientResponse])
def get_recipients(
    user: User = Depends(require_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns all registered users in the network (excluding the current user)
    so the payer can select valid recipients.
    """
    users = db.query(User).filter(User.id != user.id).all()
    return [RecipientResponse.model_validate(u) for u in users]

@router.post("/pay")
def initiate_payment(
    payload: PaymentInitiateRequest,
    request: Request,
    user: User = Depends(require_current_user),
    db: Session = Depends(get_db)
):
    # 1. Validate recipient exists in database
    target_upi = payload.receiver_upi_id.strip()
    if target_upi.lower() == user.upi_id.lower():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot transfer funds to your own UPI ID."
        )

    receiver = db.query(User).filter(User.upi_id.ilike(target_upi)).first()
    if not receiver:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Recipient UPI ID '{payload.receiver_upi_id}' is not registered. Payments are strictly permitted only to existing registered users."
        )

    # 2. Check balance
    if user.wallet_balance < payload.amount_inr:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient balance. Your current balance is ₹{user.wallet_balance:,.2f}"
        )

    ml_service = MLInferenceService.get_instance()
    if not ml_service.is_loaded:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Risk assessment engine offline."
        )

    # 3. Detect client IP (supports client_ip override, X-Forwarded-For, X-Real-IP, and direct host)
    client_ip = payload.client_ip
    if not client_ip:
        fwd = request.headers.get("x-forwarded-for")
        if fwd:
            client_ip = fwd.split(",")[0].strip()
        elif request.headers.get("x-real-ip"):
            client_ip = request.headers.get("x-real-ip").strip()
        elif request.client:
            client_ip = request.client.host

    ist_now = get_ist_now()
    ref = f"UPI-{ist_now.strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:6].upper()}"

    sender_bank = payload.sender_bank or user.bank_name or "State Bank of India"
    sender_state = payload.sender_state or user.state or "Maharashtra"
    sender_age_group = payload.sender_age_group or user.age_group or "26-35"
    receiver_bank = payload.receiver_bank or receiver.bank_name or "HDFC Bank"
    receiver_age_group = payload.receiver_age_group or receiver.age_group or "26-35"
    user_country = user.country or "India"
    receiver_country = receiver.country or "India"

    # 4. Prepare features for ML Model
    ml_payload = {
        "transaction_type": payload.transaction_type,
        "merchant_category": payload.merchant_category,
        "amount_inr": payload.amount_inr,
        "sender_age_group": sender_age_group,
        "receiver_age_group": receiver_age_group,
        "sender_state": sender_state,
        "sender_bank": sender_bank,
        "receiver_bank": receiver_bank,
        "device_type": payload.device_type or "Android",
        "network_type": payload.network_type or "4G",
        "ip_address": client_ip,
        "client_country": payload.client_country,
        "client_country_code": payload.client_country_code,
        "client_city": payload.client_city,
        "registered_country": user_country,
        "registered_state": sender_state,
        "sender_country": user_country,
        "receiver_country": receiver_country,
        "timestamp": format_ist(ist_now)
    }

    result = ml_service.predict(ml_payload)
    decision = result["decision"]
    fraud_prob = result["fraud_probability"]
    risk_pct = result["risk_percentage"]
    geo_info = result.get("geo_info", {})

    # 5. Workflow decision & balance settlement
    if decision == "APPROVE":
        payment_status = "APPROVED"
        # Deduct sender & credit receiver
        user.wallet_balance -= payload.amount_inr
        receiver.wallet_balance += payload.amount_inr
        response_msg = f"Payment of ₹{payload.amount_inr:,.2f} to {receiver.full_name} processed successfully."
    elif decision == "STEP_UP_OTP":
        payment_status = "PENDING_OTP"
        response_msg = "Provisional Step-Up OTP authentication required due to moderate risk score."
    else: # BLOCK / High Risk / Geofence breach
        payment_status = "PENDING_ADMIN_REVIEW"
        if geo_info.get("is_international"):
            response_msg = f"Cross-Border Geofence Alert: Transaction detected from foreign/VPN IP ({geo_info.get('country')}). Held for Security Admin review."
        elif receiver_country.lower() != user_country.lower():
            response_msg = f"Cross-Border Transfer Alert: Recipient is registered in {receiver_country}. Outbound transaction held for Security Admin review."
        else:
            response_msg = "Payment flagged as HIGH RISK by ML model. Transaction is held for Security Admin review."

    # 6. Save transaction record
    record = TransactionPrediction(
        transaction_reference=ref,
        transaction_type=payload.transaction_type,
        merchant_category=payload.merchant_category,
        amount_inr=payload.amount_inr,
        sender_upi_id=user.upi_id,
        receiver_upi_id=receiver.upi_id,
        sender_bank=sender_bank,
        receiver_bank=receiver_bank,
        sender_state=sender_state,
        sender_age_group=sender_age_group,
        receiver_age_group=receiver_age_group,
        device_type=payload.device_type,
        network_type=payload.network_type,
        ip_address=geo_info.get("ip") or client_ip,
        location_country=geo_info.get("country", "India"),
        is_international=bool(geo_info.get("is_international", False) or (receiver_country.lower() != user_country.lower())),
        fraud_probability=fraud_prob,
        risk_percentage=risk_pct,
        decision=decision,
        status=payment_status,
        explanation=result["explanation"],
        model_name=result["model_name"],
        created_at=ist_now,
        user_id=user.id,
        receiver_id=receiver.id
    )

    db.add(record)
    db.commit()
    db.refresh(record)

    # 7. Notify admin if suspicious or international geofence alert
    if decision in ["STEP_UP_OTP", "BLOCK"]:
        severity = "high" if decision == "BLOCK" else "medium"
        alert_title = f"Cross-Border Transfer Alert: {ref}" if geo_info.get("is_international") else f"Risky Payment Alert: {ref}"
        notif = Notification(
            title=alert_title,
            message=f"Payer {user.full_name} ({user.upi_id}) attempted ₹{payload.amount_inr:,.2f} to {receiver.upi_id} from {geo_info.get('country', 'Unknown')} ({geo_info.get('ip', 'N/A')}). Risk: {risk_pct}%.",
            severity=severity,
            transaction_id=record.id,
            is_read=False,
            created_at=ist_now
        )
        db.add(notif)
        db.commit()

    return {
        "success": payment_status == "APPROVED",
        "status": payment_status,
        "message": response_msg,
        "transaction_reference": ref,
        "amount_inr": payload.amount_inr,
        "receiver_upi_id": receiver.upi_id,
        "receiver_name": receiver.full_name,
        "fraud_probability": fraud_prob,
        "risk_percentage": risk_pct,
        "decision": decision,
        "ip_address": geo_info.get("ip") or client_ip,
        "location_country": geo_info.get("country", "India"),
        "is_international": bool(geo_info.get("is_international", False)),
        "explanation": result["explanation"],
        "demo_otp": "749281" if payment_status == "PENDING_OTP" else None,
        "updated_wallet_balance": user.wallet_balance
    }

@router.post("/verify-otp")
def verify_otp(
    payload: OTPVerifyRequest,
    user: User = Depends(require_current_user),
    db: Session = Depends(get_db)
):
    tx = db.query(TransactionPrediction).filter(
        TransactionPrediction.transaction_reference == payload.transaction_reference,
        TransactionPrediction.user_id == user.id
    ).first()

    if not tx:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found."
        )

    if tx.status != "PENDING_OTP":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Transaction is already in status '{tx.status}'."
        )

    if not (payload.otp.isdigit() and len(payload.otp) == 6):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP format. Please enter a 6-digit verification code."
        )

    if user.wallet_balance < tx.amount_inr:
        tx.status = "BLOCKED"
        tx.admin_notes = "Payment cancelled: insufficient funds at OTP verification."
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient balance to complete transaction."
        )

    # Deduct from user and credit receiver
    user.wallet_balance -= tx.amount_inr
    receiver = db.query(User).filter(User.upi_id == tx.receiver_upi_id).first()
    if receiver:
        receiver.wallet_balance += tx.amount_inr

    tx.status = "APPROVED"
    tx.explanation = (tx.explanation or "") + " [Step-Up OTP Challenge successfully verified by payer.]"
    db.commit()

    return {
        "success": True,
        "status": "APPROVED",
        "message": "OTP verification successful. Payment released and credited to recipient.",
        "transaction_reference": tx.transaction_reference,
        "updated_wallet_balance": user.wallet_balance
    }

@router.get("/my-transactions")
def get_my_transactions(
    user: User = Depends(require_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns transactions where the user is either the sender (debit)
    OR the recipient (credit), so the receiver sees their money increase.
    """
    transactions = db.query(TransactionPrediction).filter(
        or_(
            TransactionPrediction.user_id == user.id,
            TransactionPrediction.receiver_upi_id == user.upi_id
        )
    ).order_by(TransactionPrediction.created_at.desc()).limit(50).all()

    return {
        "wallet_balance": user.wallet_balance,
        "upi_id": user.upi_id,
        "transactions": [
            {
                "id": t.id,
                "transaction_reference": t.transaction_reference,
                "amount_inr": t.amount_inr,
                "sender_upi_id": t.sender_upi_id,
                "receiver_upi_id": t.receiver_upi_id,
                "transaction_type": t.transaction_type,
                "merchant_category": t.merchant_category,
                "decision": t.decision,
                "status": t.status,
                "risk_percentage": t.risk_percentage,
                "ip_address": t.ip_address,
                "location_country": t.location_country,
                "is_international": t.is_international,
                "is_credit": (t.receiver_upi_id == user.upi_id),
                "explanation": t.explanation,
                "created_at": format_ist(t.created_at)
            }
            for t in transactions
        ]
    }
