import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

logger = logging.getLogger("upi_sentinel.database")

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./upi_sentinel.db")

# Normalize Postgres dialect for SQLAlchemy 2.0 + psycopg 3
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg://", 1)
elif DATABASE_URL.startswith("postgresql://") and "+psycopg" not in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)

try:
    if "sqlite" in DATABASE_URL:
        engine = create_engine(
            DATABASE_URL,
            connect_args={"check_same_thread": False}
        )
    else:
        engine = create_engine(
            DATABASE_URL,
            pool_pre_ping=True,
            pool_recycle=300
        )
    # Test connection
    with engine.connect() as conn:
        logger.info(f"Connected to database successfully: {engine.url}")
except Exception as e:
    logger.warning(f"Failed to connect to primary database ({DATABASE_URL}): {e}. Falling back to SQLite.")
    DATABASE_URL = "sqlite:///./upi_sentinel.db"
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
