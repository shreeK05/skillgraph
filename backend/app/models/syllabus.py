import uuid
from sqlalchemy import Column, String, ForeignKey, DateTime, Integer, Text
from app.core.database import Base
from datetime import datetime

class Syllabus(Base):
    __tablename__ = "syllabi"

    id         = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id  = Column(String(36), nullable=True)
    branch     = Column(String(50), nullable=False)
    year       = Column(Integer, nullable=False)
    subjects   = Column(Text, nullable=True)   # JSON string
    pdf_file_id = Column(String(512), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    updated_by = Column(String(36), nullable=True)


class Announcement(Base):
    __tablename__ = "announcements"

    id              = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id       = Column(String(36), nullable=True)
    sender_id       = Column(String(36), ForeignKey("users.id"), nullable=False)
    sender_role     = Column(String(50), nullable=False)
    title           = Column(String(255), nullable=False)
    body            = Column(Text, nullable=False)
    audience_filter = Column(Text, nullable=True)   # JSON string
    send_at         = Column(DateTime, nullable=True)
    sent_count      = Column(Integer, default=0)
    created_at      = Column(DateTime, default=datetime.utcnow)
