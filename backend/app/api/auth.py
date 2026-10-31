from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database.db import get_db
from ..database.models import User
from ..schemas.user import UserRegisterRequest, UserLoginRequest, UserResponse, TokenResponse
from ..services.auth_service import hash_password, verify_password, create_access_token, require_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse)
def register_user(payload: UserRegisterRequest, db: Session = Depends(get_db)):
    # Check if email exists
    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists."
        )

    # Generate UPI ID if not provided
    clean_username = payload.email.split("@")[0].lower()
    upi_id = payload.upi_id or f"{clean_username}@upisentinel"

    existing_upi = db.query(User).filter(User.upi_id == upi_id).first()
    if existing_upi:
        upi_id = f"{clean_username}{int(db.query(User).count() + 1)}@upisentinel"

    # Derive age group for ML model
    age = payload.age if payload.age and payload.age > 0 else 28
    if age <= 25:
        age_group = "18-25"
    elif age <= 35:
        age_group = "26-35"
    elif age <= 50:
        age_group = "36-50"
    else:
        age_group = "50+"

    hashed_pw = hash_password(payload.password)
    user = User(
        email=payload.email.lower(),
        full_name=payload.full_name,
        upi_id=upi_id,
        password_hash=hashed_pw,
        role=payload.role if payload.role in ["user", "admin"] else "user",
        wallet_balance=500000.0, # 5 Lakhs initial wallet balance
        country=payload.country.strip() if payload.country else "India",
        state=payload.state.strip() if payload.state else "Maharashtra",
        age=age,
        age_group=age_group,
        bank_name=payload.bank_name.strip() if payload.bank_name else "State Bank of India",
        bank_account=payload.bank_account.strip() if payload.bank_account else f"{clean_username.upper()}09921"
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    access_token = create_access_token(data={"sub": str(user.id), "role": user.role, "email": user.email})
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.post("/login", response_model=TokenResponse)
def login_user(payload: UserLoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    access_token = create_access_token(data={"sub": str(user.id), "role": user.role, "email": user.email})
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.get("/me", response_model=UserResponse)
def get_me(user: User = Depends(require_current_user)):
    return UserResponse.model_validate(user)
