import uuid
from typing import ClassVar, Optional
from sqlalchemy import Column, String, Boolean, DateTime, Text
from sqlalchemy import ForeignKey
from app.core.database import Base, engine
from datetime import datetime


def _uuid_col(**kwargs):
    """UUID column that works with both SQLite (String) and PostgreSQL (UUID)."""
    return Column(String(36), **kwargs)


class User(Base):
    __tablename__ = "users"
    __allow_unmapped__ = True

    id           = _uuid_col(primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id    = Column(String(36), nullable=True, index=True)   # college id
    email        = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=True)           # nullable for Google OAuth
    full_name    = Column(String(255), nullable=True)
    role         = Column(String(50), nullable=False)              # STUDENT, DEPT_ADMIN, COMPANY, ADMIN
    is_active    = Column(Boolean, default=True)
    is_approved  = Column(Boolean, default=True)
    email_verified = Column(Boolean, default=False)
    google_id    = Column(String(255), nullable=True, unique=True)
    avatar_url   = Column(String(512), nullable=True)
    otp_code     = Column(String(10), nullable=True)
    otp_expires  = Column(DateTime, nullable=True)
    created_at   = Column(DateTime, default=datetime.utcnow)
    updated_at   = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Runtime attribute — NOT a DB column
    current_tenant_id: ClassVar[Optional[str]] = None