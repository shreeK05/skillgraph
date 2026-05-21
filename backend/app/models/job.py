import uuid
from sqlalchemy import Column, String, Float, ForeignKey, Text, DateTime
from app.core.database import Base
from datetime import datetime

class JobPosting(Base):
    __tablename__ = "job_postings"

    id               = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    company_id       = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    tenant_id        = Column(String(36), nullable=True)
    title            = Column(String(255), nullable=False)
    jd_text          = Column(Text, nullable=False)
    extracted_skills = Column(Text, default="")   # JSON string
    required_skills  = Column(Text, default="")   # JSON string
    ctc_min          = Column(Float, nullable=True)
    ctc_max          = Column(Float, nullable=True)
    location         = Column(String(255), nullable=True)
    job_type         = Column(String(50), default="FULL_TIME")  # FULL_TIME, INTERN, CONTRACT
    status           = Column(String(50), default="DRAFT")      # DRAFT, ACTIVE, CLOSED
    created_at       = Column(DateTime, default=datetime.utcnow)
    updated_at       = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)