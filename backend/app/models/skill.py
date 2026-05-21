import uuid
from sqlalchemy import Column, String, Float, ForeignKey, Boolean, Text
from app.core.database import Base

class Skill(Base):
    __tablename__ = "skills"

    id           = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name         = Column(String(255), unique=True, index=True, nullable=False)
    category     = Column(String(100), nullable=False)
    aliases      = Column(Text, default="")   # JSON string in SQLite
    demand_score = Column(Float, default=0.0)

class StudentSkill(Base):
    __tablename__ = "student_skills"

    id         = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    skill_id   = Column(String(36), ForeignKey("skills.id"), nullable=False)
    tenant_id  = Column(String(36), nullable=True)
    level      = Column(Float, default=0.0)       # 0.0 to 1.0 proficiency
    source     = Column(String(50), default="MANUAL")  # MANUAL, AI_EXTRACTED, COURSE
    verified   = Column(Boolean, default=False)