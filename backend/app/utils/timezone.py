from datetime import datetime, timezone, timedelta

# Indian Standard Time (IST = UTC+05:30)
IST = timezone(timedelta(hours=5, minutes=30))

def get_ist_now() -> datetime:
    """
    Returns current datetime in Indian Standard Time (IST) as a naive datetime
    for consistent storage and retrieval in SQLite/SQLAlchemy.
    """
    return datetime.now(IST).replace(tzinfo=None)

def get_ist_iso() -> str:
    """
    Returns current datetime formatted with explicit +05:30 timezone offset.
    """
    return datetime.now(IST).isoformat()

def format_ist(dt: datetime) -> str:
    """
    Formats a datetime object to an ISO string with +05:30 if naive.
    """
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.strftime("%Y-%m-%dT%H:%M:%S+05:30")
    return dt.astimezone(IST).isoformat()
