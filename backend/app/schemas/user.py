from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, field_serializer
from ..utils.timezone import format_ist

class UserRegisterRequest(BaseModel):
    email: str = Field(..., description="User email address")
    full_name: str
    password: str
    upi_id: Optional[str] = None
    role: Optional[str] = "user"  # "user" or "admin"
    country: Optional[str] = "India"
    state: Optional[str] = "Maharashtra"
    age: Optional[int] = 28
    bank_name: Optional[str] = "State Bank of India"
    bank_account: Optional[str] = None

class UserLoginRequest(BaseModel):
    email: str = Field(..., description="User email address")
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    upi_id: str
    role: str
    wallet_balance: float
    country: Optional[str] = "India"
    state: Optional[str] = "Maharashtra"
    age: Optional[int] = 28
    age_group: Optional[str] = "26-35"
    bank_name: Optional[str] = "State Bank of India"
    bank_account: Optional[str] = None
    created_at: datetime

    @field_serializer("created_at")
    def serialize_user_created_at(self, dt: datetime, _info):
        return format_ist(dt)

    class Config:
        from_attributes = True

class RecipientResponse(BaseModel):
    id: int
    full_name: str
    upi_id: str
    email: str
    country: Optional[str] = "India"
    bank_name: Optional[str] = "HDFC Bank"
    bank_account: Optional[str] = None
    state: Optional[str] = "Maharashtra"
    age_group: Optional[str] = "26-35"

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class PaymentInitiateRequest(BaseModel):
    receiver_upi_id: str
    amount_inr: float = Field(..., gt=0)
    transaction_type: str = "P2P"
    merchant_category: str = "Other"
    sender_bank: Optional[str] = "SBI"
    receiver_bank: Optional[str] = "HDFC"
    sender_state: Optional[str] = "Maharashtra"
    sender_country: Optional[str] = "India"
    device_type: Optional[str] = "Android"
    network_type: Optional[str] = "4G"
    sender_age_group: Optional[str] = "26-35"
    receiver_age_group: Optional[str] = "26-35"
    client_ip: Optional[str] = None
    client_country: Optional[str] = None
    client_country_code: Optional[str] = None
    client_city: Optional[str] = None

class OTPVerifyRequest(BaseModel):
    transaction_reference: str
    otp: str

class AdminReviewRequest(BaseModel):
    transaction_id: int
    action: str = Field(..., description="'APPROVE' or 'REJECT'")
    admin_notes: Optional[str] = None

class ThresholdUpdateRequest(BaseModel):
    block_threshold: float = Field(..., ge=0.05, le=0.99, description="Block fraud cutoff (e.g. 0.57)")
    otp_threshold: float = Field(..., ge=0.01, le=0.95, description="Step-up OTP cutoff (e.g. 0.28)")
