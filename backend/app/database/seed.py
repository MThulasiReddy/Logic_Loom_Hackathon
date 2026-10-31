import os
from datetime import datetime, timedelta
from sqlalchemy import text
from .db import engine, SessionLocal, Base
from .models import User, TransactionPrediction, Notification
from ..services.auth_service import hash_password
from ..utils.timezone import get_ist_now

def seed_database():
    # 1. Create tables
    Base.metadata.create_all(bind=engine)
    
    # Auto-migrate SQLite columns if table already existed without new profile columns
    try:
        with engine.connect() as conn:
            # Check users table info
            result = conn.execute(text("PRAGMA table_info(users)"))
            existing_columns = {row[1] for row in result.fetchall()}
            
            new_columns = [
                ("country", "VARCHAR(64) DEFAULT 'India'"),
                ("state", "VARCHAR(64) DEFAULT 'Maharashtra'"),
                ("age", "INTEGER DEFAULT 28"),
                ("age_group", "VARCHAR(32) DEFAULT '26-35'"),
                ("bank_name", "VARCHAR(64) DEFAULT 'State Bank of India'"),
                ("bank_account", "VARCHAR(64) NULL")
            ]
            
            for col_name, col_def in new_columns:
                if col_name not in existing_columns:
                    conn.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_def}"))
                    print(f"[Migration] Added column {col_name} to users table.")
            conn.commit()
    except Exception as e:
        print(f"[Migration Warning] SQLite column migration skipped or failed: {e}")

    db = SessionLocal()

    try:
        # 2. Seed Default Admin Account (only if not already created)
        admin = db.query(User).filter(User.email == "admin@upisentinel.com").first()
        if not admin:
            admin = User(
                email="admin@upisentinel.com",
                full_name="Security Operations Lead",
                upi_id="admin@upisentinel",
                password_hash=hash_password("Admin@2024"),
                role="admin",
                wallet_balance=500000.0,
                country="India",
                state="Maharashtra",
                age=35,
                age_group="26-35",
                bank_name="State Bank of India",
                bank_account="SBI009281920",
                created_at=get_ist_now() - timedelta(days=30)
            )
            db.add(admin)
            db.commit()
            print("[Seed] Created admin: admin@upisentinel.com / Admin@2024")
        
        # No demo users seeded — all users must self-register via /register.
        # Transactions are only created when users actually make payments via the UPI Pay page.
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
