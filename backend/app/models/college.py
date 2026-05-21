import uuid
from sqlalchemy import Column, String, DateTime
from app.core.database import Base
from datetime import datetime

class College(Base):
    __tablename__ = "colleges"

    id          = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name        = Column(String(255), nullable=False)
    subdomain   = Column(String(100), unique=True, index=True, nullable=False)
    plan        = Column(String(50), default="free")
    subscription_end = Column(DateTime, nullable=True)
    created_at  = Column(DateTime, default=datetime.utcnow)