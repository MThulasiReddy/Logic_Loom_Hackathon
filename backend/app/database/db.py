
import os
import logging

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

logger = logging.getLogger("upi_sentinel.database")

# Local development fallback only
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    DATABASE_URL = "sqlite:///./upi_sentinel.db"
    logger.warning("DATABASE_URL not configured. Using local SQLite database.")

# Normalize PostgreSQL URL for Psycopg 3
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace(
        "postgres://",
        "postgresql+psycopg://",
        1
    )
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace(
        "postgresql://",
        "postgresql+psycopg://",
        1
    )

try:
    if DATABASE_URL.startswith("sqlite"):
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

    # Verify database connection
    with engine.connect() as conn:
        conn.exec_driver_sql("SELECT 1")

    logger.info(
        "Database connected successfully: %s",
        engine.url.render_as_string(hide_password=True)
    )

except Exception as e:
    logger.exception("Database connection failed")
    raise RuntimeError(
        "Unable to connect to configured database. "
        "Check DATABASE_URL and database availability."
    ) from e


SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
