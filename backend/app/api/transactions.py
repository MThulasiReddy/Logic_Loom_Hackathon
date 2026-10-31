from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc

from ..database.db import get_db
from ..database.models import TransactionPrediction, User
from ..schemas.transaction import TransactionDetail, PaginatedTransactions
from ..services.auth_service import get_current_user

router = APIRouter(prefix="/api", tags=["Transactions"])

@router.get("/transactions", response_model=PaginatedTransactions)
def get_transactions(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(15, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search by reference, category, bank, or state"),
    decision: Optional[str] = Query(None, description="Filter by decision: APPROVE, STEP_UP_OTP, BLOCK"),
    transaction_type: Optional[str] = Query(None, description="Filter by type: P2P, P2M, Bill Payment, Recharge"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status"),
    sort_by: Optional[str] = Query("created_at", description="Field to sort by: created_at, amount_inr, risk_percentage"),
    order: Optional[str] = Query("desc", description="Sort order: asc or desc"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    query = db.query(TransactionPrediction)

    # Scoping: If user is not an admin, ONLY show transactions belonging to this user
    if not current_user or current_user.role != "admin":
        if current_user:
            query = query.filter(TransactionPrediction.user_id == current_user.id)
        else:
            query = query.filter(TransactionPrediction.id == -1)

    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                TransactionPrediction.transaction_reference.ilike(search_pattern),
                TransactionPrediction.merchant_category.ilike(search_pattern),
                TransactionPrediction.sender_bank.ilike(search_pattern),
                TransactionPrediction.receiver_bank.ilike(search_pattern),
                TransactionPrediction.sender_state.ilike(search_pattern),
                TransactionPrediction.sender_upi_id.ilike(search_pattern),
                TransactionPrediction.receiver_upi_id.ilike(search_pattern)
            )
        )

    if decision and decision.upper() != "ALL":
        query = query.filter(TransactionPrediction.decision == decision.upper())

    if transaction_type and transaction_type.upper() != "ALL":
        query = query.filter(TransactionPrediction.transaction_type == transaction_type)

    if status_filter and status_filter.upper() != "ALL":
        query = query.filter(TransactionPrediction.status == status_filter.upper())

    total = query.count()

    # Sorting
    sort_col = getattr(TransactionPrediction, sort_by, TransactionPrediction.created_at)
    if order.lower() == "asc":
        query = query.order_by(asc(sort_col))
    else:
        query = query.order_by(desc(sort_col))

    offset = (page - 1) * limit
    items = query.offset(offset).limit(limit).all()

    total_pages = (total + limit - 1) // limit if total > 0 else 1

    return PaginatedTransactions(
        total=total,
        page=page,
        limit=limit,
        total_pages=total_pages,
        transactions=[TransactionDetail.model_validate(t) for t in items]
    )

@router.get("/transactions/{id}", response_model=TransactionDetail)
def get_transaction_by_id(
    id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    query = db.query(TransactionPrediction).filter(TransactionPrediction.id == id)
    if current_user and current_user.role != "admin":
        query = query.filter(TransactionPrediction.user_id == current_user.id)

    tx = query.first()
    if not tx:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transaction with ID {id} was not found or access is denied."
        )
    return TransactionDetail.model_validate(tx)
