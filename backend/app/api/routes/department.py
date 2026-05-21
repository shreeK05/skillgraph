# file: backend/app/api/routes/department.py
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
import uuid

from app.core.database import get_db
from app.middleware.tenant import get_current_dept_admin, get_current_user
from app.models.user import User
from app.models.student import StudentProfile
from app.models.syllabus import Syllabus, Announcement
from app.data.vit_syllabus import VIT_SYLLABUS, get_subjects
from app.ml.resume_engine import ai_resume_engine
from app.ml.skill_extractor.skills_taxonomy import SKILLS

router = APIRouter()


# ==========================================
# 1. SYLLABUS ROUTES (pre-loaded VIT data)
# ==========================================
@router.get("/syllabus/{branch}/{year}")
def get_syllabus(branch: str, year: int, db: Session = Depends(get_db)):
    """Get syllabus for a branch+year. Returns VIT official data if not customised."""
    # Try DB first (custom edits)
    record = db.query(Syllabus).filter(
        Syllabus.branch == branch, Syllabus.year == year
    ).first()

    if record and record.subjects:
        return {"branch": branch, "year": year, "subjects": record.subjects, "source": "custom"}

    # Fall back to official VIT syllabus seed data
    subjects = get_subjects(branch, year)
    return {"branch": branch, "year": year, "subjects": subjects, "source": "official"}


@router.get("/syllabus/all")
def get_all_syllabi(db: Session = Depends(get_db)):
    """Return all branches + years from VIT official data."""
    result = {}
    for branch, years in VIT_SYLLABUS.items():
        result[branch] = {}
        for year, data in years.items():
            result[branch][str(year)] = data.get("subjects", [])
    return result


class SyllabusUpdate(BaseModel):
    subjects: List[dict]


@router.put("/syllabus/{branch}/{year}")
def update_syllabus(
    branch: str, year: int, req: SyllabusUpdate,
    current_user: User = Depends(get_current_dept_admin),
    db: Session = Depends(get_db)
):
    record = db.query(Syllabus).filter(
        Syllabus.branch == branch, Syllabus.year == year,
        Syllabus.tenant_id == current_user.current_tenant_id
    ).first()

    if record:
        record.subjects = req.subjects
        record.updated_by = current_user.id
    else:
        record = Syllabus(
            id=uuid.uuid4(),
            tenant_id=current_user.current_tenant_id,
            branch=branch, year=year,
            subjects=req.subjects,
            updated_by=current_user.id
        )
        db.add(record)

    db.commit()
    return {"message": "Syllabus updated", "branch": branch, "year": year}


# ==========================================
# 2. STUDENTS ANALYTICS
# ==========================================
@router.get("/students")
def list_students(
    branch: Optional[str] = None,
    year: Optional[int] = None,
    placement_status: Optional[str] = None,
    min_cgpa: Optional[float] = None,
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    current_user: User = Depends(get_current_dept_admin),
    db: Session = Depends(get_db)
):
    query = db.query(StudentProfile).filter(
        StudentProfile.tenant_id == current_user.current_tenant_id
    )
    if branch: query = query.filter(StudentProfile.branch == branch)
    if year:   query = query.filter(StudentProfile.year_of_study == year)
    if placement_status: query = query.filter(StudentProfile.placement_status == placement_status)
    if min_cgpa: query = query.filter(StudentProfile.cgpa >= min_cgpa)
    if search:
        query = query.filter(StudentProfile.full_name.ilike(f"%{search}%"))

    total = query.count()
    students = query.offset((page - 1) * limit).limit(limit).all()

    return {
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit,
        "students": [
            {
                "id": str(s.id),
                "full_name": s.full_name or "Unnamed",
                "branch": s.branch,
                "year_of_study": s.year_of_study,
                "cgpa": s.cgpa,
                "placement_status": s.placement_status,
                "readiness_score": round(s.readiness_score or 0, 1),
                "photo_url": s.photo_url,
                "github_url": s.github_url,
                "linkedin_url": s.linkedin_url,
            }
            for s in students
        ]
    }


@router.get("/analytics/overview")
def get_analytics(
    current_user: User = Depends(get_current_dept_admin),
    db: Session = Depends(get_db)
):
    from sqlalchemy import func
    tid = current_user.current_tenant_id

    total = db.query(StudentProfile).filter(StudentProfile.tenant_id == tid).count()
    placed = db.query(StudentProfile).filter(StudentProfile.tenant_id == tid, StudentProfile.placement_status == "PLACED").count()
    applied = db.query(StudentProfile).filter(StudentProfile.tenant_id == tid, StudentProfile.placement_status == "APPLIED").count()
    avg_score = db.query(func.avg(StudentProfile.readiness_score)).filter(StudentProfile.tenant_id == tid).scalar() or 0
    avg_cgpa  = db.query(func.avg(StudentProfile.cgpa)).filter(StudentProfile.tenant_id == tid, StudentProfile.cgpa != None).scalar() or 0

    # Branch-wise breakdown
    branch_stats = db.query(
        StudentProfile.branch,
        func.count(StudentProfile.id),
        func.avg(StudentProfile.readiness_score)
    ).filter(StudentProfile.tenant_id == tid).group_by(StudentProfile.branch).all()

    return {
        "total_students": total,
        "placed": placed,
        "applied": applied,
        "placement_rate": round((placed / total * 100) if total else 0, 1),
        "avg_readiness_score": round(float(avg_score), 1),
        "avg_cgpa": round(float(avg_cgpa), 2),
        "branch_breakdown": [
            {"branch": b, "count": c, "avg_score": round(float(s or 0), 1)}
            for b, c, s in branch_stats if b
        ]
    }


# ==========================================
# 3. ANNOUNCEMENTS
# ==========================================
class AnnouncementCreate(BaseModel):
    title: str
    body: str
    audience_filter: Optional[dict] = None


@router.get("/announcements")
def list_announcements(
    current_user: User = Depends(get_current_dept_admin),
    db: Session = Depends(get_db)
):
    anns = db.query(Announcement).filter(
        Announcement.tenant_id == current_user.current_tenant_id,
        Announcement.sender_role == "DEPT_ADMIN"
    ).order_by(Announcement.created_at.desc()).limit(50).all()
    return anns


@router.post("/announcements")
def create_announcement(
    req: AnnouncementCreate,
    current_user: User = Depends(get_current_dept_admin),
    db: Session = Depends(get_db)
):
    ann = Announcement(
        id=uuid.uuid4(),
        tenant_id=current_user.current_tenant_id,
        sender_id=current_user.id,
        sender_role="DEPT_ADMIN",
        title=req.title,
        body=req.body,
        audience_filter=req.audience_filter or {"all": True}
    )
    db.add(ann)
    db.commit()
    db.refresh(ann)

    # Fire email in background thread
    try:
        from app.services.email_service import send_announcement_emails
        import threading
        t = threading.Thread(
            target=send_announcement_emails,
            args=(req.title, req.body, req.audience_filter or {"all": True}),
            daemon=True
        )
        t.start()
    except Exception:
        pass

    return {"message": "Announcement sent", "id": str(ann.id)}


# ==========================================
# 4. SYLLABUS GAP ANALYSIS (existing endpoint preserved)
# ==========================================
@router.post("/syllabus/analyze")
async def analyze_syllabus(file: UploadFile = File(...)):
    """Receives a syllabus PDF and finds curriculum gaps vs industry."""
    try:
        file_bytes = await file.read()
        raw_text = ai_resume_engine.extract_text_from_pdf(file_bytes)
        if not raw_text:
            raise HTTPException(status_code=400, detail="Could not extract text from syllabus PDF.")

        taught_skills = ai_resume_engine.extract_skills(raw_text)
        lookup = {}
        for category, skills in SKILLS.items():
            for s in skills:
                lookup[s["name"].lower()] = {"canonical": s["name"], "category": category, "demand": s.get("demand", 0.0)}
                for a in s.get("aliases", []):
                    lookup[a.lower()] = {"canonical": s["name"], "category": category, "demand": s.get("demand", 0.0)}

        normalized = []
        seen = {}
        for s in taught_skills:
            meta = lookup.get(s.lower())
            entry = meta if meta else {"canonical": s, "category": None, "demand": 0.0}
            seen[entry["canonical"].lower()] = entry

        industry_standards = [
            "React.js", "Node.js", "Python", "Machine Learning", "Docker",
            "AWS", "Kubernetes", "TypeScript", "PostgreSQL", "MongoDB",
        ]
        taught_set = set(seen.keys())
        missing = [s for s in industry_standards if s.lower() not in taught_set]

        return {
            "filename": file.filename,
            "extracted_skills": list(seen.values()),
            "industry_missing": missing
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))