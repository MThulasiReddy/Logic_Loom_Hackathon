import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from .db import Base
from ..utils.timezone import get_ist_now

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    upi_id = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="user", nullable=False) # 'admin' or 'user'
    wallet_balance = Column(Float, default=500000.0, nullable=False) # 5 Lakhs INR default
    
    # User Profile & Geofencing baseline
    country = Column(String(64), default="India", nullable=True)
    state = Column(String(64), default="Maharashtra", nullable=True)
    age = Column(Integer, default=28, nullable=True)
    age_group = Column(String(32), default="26-35", nullable=True)
    bank_name = Column(String(64), default="State Bank of India", nullable=True)
    bank_account = Column(String(64), nullable=True)
    
    created_at = Column(DateTime, default=get_ist_now, nullable=False)

    transactions = relationship("TransactionPrediction", foreign_keys="TransactionPrediction.user_id", back_populates="user")


class TransactionPrediction(Base):
    __tablename__ = "transaction_predictions"

    id = Column(Integer, primary_key=True, index=True)
    transaction_reference = Column(String(128), unique=True, index=True, nullable=False)
    transaction_type = Column(String(64), nullable=False)
    merchant_category = Column(String(64), nullable=False)
    amount_inr = Column(Float, nullable=False)
    
    sender_upi_id = Column(String(255), nullable=True)
    receiver_upi_id = Column(String(255), nullable=True)
    
    sender_bank = Column(String(64), nullable=True)
    receiver_bank = Column(String(64), nullable=True)
    sender_state = Column(String(64), nullable=True)
    sender_age_group = Column(String(32), nullable=True)
    receiver_age_group = Column(String(32), nullable=True)
    device_type = Column(String(32), nullable=True)
    network_type = Column(String(32), nullable=True)
    
    # Location & IP Geofencing
    ip_address = Column(String(64), nullable=True)
    location_country = Column(String(64), default="India", nullable=True)
    is_international = Column(Boolean, default=False, nullable=False)
    
    fraud_probability = Column(Float, nullable=False)
    risk_percentage = Column(Float, nullable=False)
    decision = Column(String(32), nullable=False)  # 'APPROVE', 'STEP_UP_OTP', 'BLOCK'
    status = Column(String(32), default="APPROVED", nullable=False) # 'APPROVED', 'PENDING_OTP', 'PENDING_ADMIN_REVIEW', 'ADMIN_APPROVED', 'ADMIN_REJECTED', 'BLOCKED'
    
    explanation = Column(Text, nullable=True)
    admin_notes = Column(Text, nullable=True)
    model_name = Column(String(128), nullable=False)
    created_at = Column(DateTime, default=get_ist_now, index=True, nullable=False)
    
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    user = relationship("User", foreign_keys=[user_id], back_populates="transactions")
    receiver = relationship("User", foreign_keys=[receiver_id])


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    severity = Column(String(32), default="medium", nullable=False) # 'low', 'medium', 'high'
    transaction_id = Column(Integer, ForeignKey("transaction_predictions.id"), nullable=True)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=get_ist_now, index=True, nullable=False)


class SystemSettings(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    block_threshold = Column(Float, default=0.571, nullable=False)
    otp_threshold = Column(Float, default=0.2855, nullable=False)
    updated_at = Column(DateTime, default=get_ist_now, nullable=False)
