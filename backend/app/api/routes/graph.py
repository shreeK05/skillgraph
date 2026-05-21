# file: backend/app/api/routes/graph.py
from fastapi import APIRouter, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.neo4j_service import neo4j_service

router = APIRouter()

@router.get("/learning-path")
def get_student_learning_path(role: str, student_id: str = "demo-student"):
    """
    Returns the personalized learning path for the student to reach the target role.
    """
    try:
        path = neo4j_service.get_learning_path(
            student_id=str(student_id), 
            role_title=role
        )
        return {"target_role": role, "learning_path": path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))