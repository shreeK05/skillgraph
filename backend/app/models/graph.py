import uuid
from sqlalchemy import Column, String, ForeignKey, DateTime, Integer, Float, Boolean, Table
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime

class GraphConcept(Base):
    __tablename__ = "graph_concepts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True, index=True, nullable=False)
    category = Column(String, nullable=True) # e.g. "Framework", "Language", "Concept"
    created_at = Column(DateTime, default=datetime.utcnow)

class GraphRelation(Base):
    __tablename__ = "graph_relations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_id = Column(UUID(as_uuid=True), ForeignKey("graph_concepts.id"), nullable=False, index=True)
    target_id = Column(UUID(as_uuid=True), ForeignKey("graph_concepts.id"), nullable=False, index=True)
    relation_type = Column(String, nullable=False) # e.g. "TAUGHT_IN", "PREREQUISITE_FOR", "RELATED_TO"
    weight = Column(Float, default=1.0)
    
    # Metadata for syllabus specific links
    branch = Column(String, nullable=True)
    year = Column(Integer, nullable=True)
