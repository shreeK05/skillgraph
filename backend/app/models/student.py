import uuid
from sqlalchemy import Column, String, Float, ForeignKey, Integer, Text, Boolean, DateTime
from app.core.database import Base
from datetime import datetime

class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id               = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id          = Column(String(36), ForeignKey("users.id"), unique=True, nullable=False)
    tenant_id        = Column(String(36), nullable=True)

    # Identity
    full_name        = Column(String(255), nullable=True)
    prn              = Column(String(50), nullable=True, index=True)
    photo_url        = Column(String(512), nullable=True)
    bio              = Column(Text, nullable=True)

    # Academic
    branch           = Column(String(50), nullable=True)
    year_of_study    = Column(Integer, nullable=True)
    section          = Column(String(10), nullable=True)
    cgpa             = Column(Float, nullable=True)
    graduation_year  = Column(Integer, nullable=True)
    num_backlogs     = Column(Integer, default=0)

    # Links
    github_url       = Column(String(512), nullable=True)
    linkedin_url     = Column(String(512), nullable=True)
    portfolio_url    = Column(String(512), nullable=True)

    # Resume
    resume_url       = Column(String(512), nullable=True)

    # AI computed
    readiness_score  = Column(Float, default=0.0)
    placement_status = Column(String(50), default="NOT_PLACED")

    created_at       = Column(DateTime, default=datetime.utcnow)
    updated_at       = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Certification(Base):
    __tablename__ = "certifications"

    id                   = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id           = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    tenant_id            = Column(String(36), nullable=True)
    name                 = Column(String(255), nullable=False)
    issuer               = Column(String(255), nullable=True)
    issue_date           = Column(String(20), nullable=True)
    credential_url       = Column(String(512), nullable=True)
    certificate_file_id  = Column(String(512), nullable=True)
    created_at           = Column(DateTime, default=datetime.utcnow)


class Hackathon(Base):
    __tablename__ = "hackathons"

    id          = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id  = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    tenant_id   = Column(String(36), nullable=True)
    event_name  = Column(String(255), nullable=False)
    position    = Column(String(100), nullable=True)
    year        = Column(Integer, nullable=True)
    description = Column(Text, nullable=True)
    proof_url   = Column(String(512), nullable=True)
    created_at  = Column(DateTime, default=datetime.utcnow)


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id          = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id  = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    role        = Column(String(100), nullable=False)
    round_type  = Column(String(50), nullable=False)
    score       = Column(Float, nullable=True)
    transcript  = Column(Text, nullable=True)   # JSON string
    created_at  = Column(DateTime, default=datetime.utcnow)