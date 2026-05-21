import uuid
from sqlalchemy import Column, String, ForeignKey, DateTime, Integer, Text, Float
from app.core.database import Base
from datetime import datetime

class CompanyProfile(Base):
    __tablename__ = "company_profiles"

    id           = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id      = Column(String(36), ForeignKey("users.id"), unique=True, nullable=False)
    name         = Column(String(255), nullable=False)
    logo_url     = Column(String(512), nullable=True)
    industry     = Column(String(100), nullable=True)
    website      = Column(String(512), nullable=True)
    description  = Column(Text, nullable=True)
    size         = Column(String(50), nullable=True)
    hq_location  = Column(String(255), nullable=True)
    founded_year = Column(Integer, nullable=True)
    perks        = Column(Text, nullable=True)   # JSON string
    created_at   = Column(DateTime, default=datetime.utcnow)
