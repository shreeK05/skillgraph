import uuid
from sqlalchemy import Column, String, Float, ForeignKey, Integer, DateTime, Text
from app.core.database import Base
from datetime import datetime

class Drive(Base):
    __tablename__ = "drives"

    id                = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    job_id            = Column(String(36), ForeignKey("job_postings.id"), nullable=False)
    tenant_id         = Column(String(36), nullable=True)
    drive_date        = Column(DateTime, nullable=True)
    min_cgpa          = Column(Float, default=0.0)
    eligible_branches = Column(Text, default="")   # JSON string
    eligible_years    = Column(Text, default="")   # JSON string
    status            = Column(String(50), default="SCHEDULED")  # SCHEDULED, ONGOING, COMPLETED, CANCELLED
    max_seats         = Column(Integer, nullable=True)
    created_at        = Column(DateTime, default=datetime.utcnow)

class Application(Base):
    __tablename__ = "applications"

    id          = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id  = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    drive_id    = Column(String(36), ForeignKey("drives.id"), nullable=False, index=True)
    tenant_id   = Column(String(36), nullable=True)
    status      = Column(String(50), default="APPLIED")  # APPLIED, SHORTLISTED, REJECTED, SELECTED
    match_score = Column(Float, default=0.0)
    applied_at  = Column(DateTime, default=datetime.utcnow)