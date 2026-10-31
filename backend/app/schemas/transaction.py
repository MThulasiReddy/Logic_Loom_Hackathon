from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_serializer
from ..utils.timezone import format_ist

class PredictionRequest(BaseModel):
    transaction_reference: Optional[str] = Field(None, description="Unique transaction reference ID")
    transaction_type: str = Field(..., description="Transaction type: P2P, P2M, Bill Payment, Recharge")
    merchant_category: str = Field(..., description="Merchant category or 'Other'")
    amount_inr: float = Field(..., gt=0, description="Amount in Indian Rupees")
    sender_age_group: str = Field("26-35", description="Age bracket of sender")
    receiver_age_group: str = Field("26-35", description="Age bracket of receiver")
    sender_state: str = Field("Maharashtra", description="State of transaction origination")
    sender_bank: str = Field("SBI", description="Originating banking institution")
    receiver_bank: str = Field("HDFC", description="Beneficiary banking institution")
    device_type: str = Field("Android", description="Originating client platform")
    network_type: str = Field("4G", description="Network carrier connection")
    timestamp: Optional[str] = Field(None, description="ISO timestamp")
    txn_hour: Optional[int] = Field(None, ge=0, le=23)
    day_of_week: Optional[int] = Field(None, ge=0, le=6)
    sender_upi_id: Optional[str] = None
    receiver_upi_id: Optional[str] = None
    ip_address: Optional[str] = None
    client_ip: Optional[str] = None

class PredictionResponse(BaseModel):
    id: Optional[int] = None
    transaction_reference: str
    transaction_type: str
    merchant_category: str
    amount_inr: float
    fraud_probability: float
    risk_percentage: float
    decision: str
    status: str
    explanation: str
    model_name: str
    thresholds: Dict[str, float]
    ip_address: Optional[str] = None
    location_country: Optional[str] = "India"
    is_international: bool = False
    created_at: Optional[datetime] = None

    @field_serializer("created_at")
    def serialize_prediction_created_at(self, dt: Optional[datetime], _info):
        return format_ist(dt) if dt else None

class TransactionDetail(BaseModel):
    id: int
    transaction_reference: str
    transaction_type: str
    merchant_category: str
    amount_inr: float
    sender_upi_id: Optional[str] = None
    receiver_upi_id: Optional[str] = None
    sender_bank: Optional[str] = None
    receiver_bank: Optional[str] = None
    sender_state: Optional[str] = None
    sender_age_group: Optional[str] = None
    receiver_age_group: Optional[str] = None
    device_type: Optional[str] = None
    network_type: Optional[str] = None
    ip_address: Optional[str] = None
    location_country: Optional[str] = "India"
    is_international: bool = False
    fraud_probability: float
    risk_percentage: float
    decision: str
    status: str
    explanation: Optional[str] = None
    admin_notes: Optional[str] = None
    model_name: str
    created_at: datetime
    is_credit: Optional[bool] = False

    @field_serializer("created_at")
    def serialize_created_at(self, dt: datetime, _info):
        return format_ist(dt)

    class Config:
        from_attributes = True

class PaginatedTransactions(BaseModel):
    total: int
    page: int
    limit: int
    total_pages: int
    transactions: List[TransactionDetail]

class DashboardStats(BaseModel):
    total_transactions: int
    approved_transactions: int
    otp_challenges: int
    blocked_transactions: int
    pending_admin_reviews: int
    avg_fraud_probability: float
    high_risk_percentage: float
    total_volume_inr: float
    risk_distribution: Dict[str, int]
    recent_suspicious: List[TransactionDetail]

class ModelInfoResponse(BaseModel):
    status: str
    model_name: str
    project: str
    decision_threshold: float
    otp_threshold_provisional: float
    block_threshold: float
    is_customized_by_admin: Optional[bool] = False
    threshold_method: Optional[str] = None
    evaluation_metrics: Dict[str, Any]
    input_features: List[str]
    numeric_features: List[str]
    categorical_features: List[str]
    excluded_columns: List[str]
    note: Optional[str] = None
