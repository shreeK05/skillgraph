# file: backend/app/api/routes/student.py
import os
import tempfile
import asyncio
import importlib

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.core.database import get_db
from app.middleware.tenant import get_current_student
from app.models.user import User
from app.models.student import StudentProfile, Certification, Hackathon, InterviewSession
from app.models.skill import Skill, StudentSkill
from app.services.cloudinary_service import upload_photo, upload_resume as upload_resume_cloud

from app.core.ml import resume_parser, mock_interview_engine, readiness_scorer
from app.ml.resume_engine import ai_resume_engine
from app.ml.skill_extractor.skills_taxonomy import SKILLS

router = APIRouter()

# ==========================================
# 1. INITIALIZE LOCAL WHISPER AI
# ==========================================
# Lazy-loaded Whisper model: avoid expensive import-time load to keep server responsive
whisper_model = None


# ==========================================
# 2. PYDANTIC MODELS
# ==========================================
class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    prn: Optional[str] = None
    cgpa: Optional[float] = None
    branch: Optional[str] = None
    year_of_study: Optional[int] = None
    section: Optional[str] = None
    graduation_year: Optional[int] = None
    num_backlogs: Optional[int] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None

class CertificationCreate(BaseModel):
    name: str
    issuer: Optional[str] = None
    issue_date: Optional[str] = None
    credential_url: Optional[str] = None

class HackathonCreate(BaseModel):
    event_name: str
    position: Optional[str] = None
    year: Optional[int] = None
    description: Optional[str] = None
    proof_url: Optional[str] = None

class InterviewStart(BaseModel):
    role: str
    round_type: str

class InterviewEvaluate(BaseModel):
    question: str
    answer: str
    role: str

class InterviewSubmission(BaseModel):
    question: str
    answer: str
    role: str
    round_type: Optional[str] = "Technical"


# Temporary helper endpoint for CI/smoke tests: analyze raw resume text (no PDF required)
class ResumeTextRequest(BaseModel):
    text: str
    target_job_description: Optional[str] = "Software Engineer with experience in Python, React, and AWS."


# ==========================================
# 3. STUDENT PROFILE ROUTES
# ==========================================
@router.get("/profile")
def get_profile(current_user: User = Depends(get_current_student), db: Session = Depends(get_db)):
    profile = db.query(StudentProfile).filter(
        StudentProfile.user_id == current_user.id,
        StudentProfile.tenant_id == current_user.current_tenant_id
    ).first()
    
    if not profile:
        profile = StudentProfile(user_id=current_user.id, tenant_id=current_user.current_tenant_id)
        db.add(profile)
        db.commit()
        db.refresh(profile)

    # --- CALCULATE XGBOOST READINESS SCORE ---
    skill_count = db.query(StudentSkill).filter(StudentSkill.student_id == current_user.id).count()
    
    features = {
        "skill_match_pct": min(skill_count * 5, 100), 
        "cgpa_normalized": float(profile.cgpa or 0) * 10,
        "project_count": 3, 
        "certification_count": 1,
        "mock_interview_avg": 75, 
        "resume_completeness": 100 if skill_count > 0 else 0
    }

    ai_prediction = readiness_scorer.predict(features)
    profile.readiness_score = ai_prediction["score"]
    db.commit()
    db.refresh(profile)
        
    return {
        "email": current_user.email, 
        "role": current_user.role, 
        "profile": profile,
        "ai_insights": ai_prediction["explanation"] 
    }

@router.put("/profile")
def update_profile(req: ProfileUpdate, current_user: User = Depends(get_current_student), db: Session = Depends(get_db)):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        profile = StudentProfile(user_id=current_user.id, tenant_id=current_user.current_tenant_id)
        db.add(profile)

    fields = ["full_name","bio","prn","cgpa","branch","year_of_study","section",
              "graduation_year","num_backlogs","github_url","linkedin_url","portfolio_url"]
    for f in fields:
        v = getattr(req, f, None)
        if v is not None:
            setattr(profile, f, v)
    # Also sync full_name on User
    if req.full_name:
        current_user.full_name = req.full_name

    db.commit()
    db.refresh(profile)
    return {"message": "Profile updated successfully", "profile": profile}


# ==========================================
# 4. RESUME AI ROUTES
# ==========================================
@router.post("/resume")
async def upload_resume(file: UploadFile = File(...), current_user: User = Depends(get_current_student), db: Session = Depends(get_db)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    pdf_bytes = await file.read()
    parsed_data = resume_parser.parse(pdf_bytes)

    # Normalize skills using taxonomy lookup
    def _build_lookup():
        lookup = {}
        for category, skills in SKILLS.items():
            for s in skills:
                lookup[s["name"].lower()] = {"canonical": s["name"], "category": category, "demand": s.get("demand", 0.0)}
                for a in s.get("aliases", []):
                    lookup[a.lower()] = {"canonical": s["name"], "category": category, "demand": s.get("demand", 0.0), "alias": a}
        return lookup

    lookup = _build_lookup()

    added_skills = []
    enriched_skills = []
    for extracted in parsed_data["skills"]:
        raw_name = extracted.get("name") if isinstance(extracted, dict) else str(extracted)
        key = raw_name.lower()
        norm = lookup.get(key)
        if norm:
            canonical = norm["canonical"]
        else:
            canonical = raw_name

        skill_obj = db.query(Skill).filter(Skill.name == canonical).first()
        if skill_obj:
            exists = db.query(StudentSkill).filter(
                StudentSkill.student_id == current_user.id,
                StudentSkill.skill_id == skill_obj.id
            ).first()

            if not exists:
                new_student_skill = StudentSkill(
                    student_id=current_user.id, skill_id=skill_obj.id,
                    tenant_id=current_user.current_tenant_id, level=extracted.get("confidence", 0.6) if isinstance(extracted, dict) else 0.6,
                    source="AI_EXTRACTED"
                )
                db.add(new_student_skill)
                added_skills.append(skill_obj.name)

        enriched_skills.append({
            "canonical": canonical,
            "raw": raw_name,
            "category": norm.get("category") if norm else None,
            "demand": norm.get("demand") if norm else None,
            "confidence": extracted.get("confidence", 0.6) if isinstance(extracted, dict) else 0.6
        })

    db.commit()
    return {"message": "Resume parsed successfully", "email_found": parsed_data["email"], "skills_added_to_profile": added_skills, "extracted_skills": enriched_skills}

@router.post("/resume/analyze")
async def analyze_resume(
    resume: UploadFile = File(...), 
    target_job_description: str = Form("Software Engineer with experience in Python, React, and AWS.")
):
    """Parses PDF text, extracts skills, and matches against Job Description."""
    file_bytes = await resume.read()
    raw_text = ai_resume_engine.extract_text_from_pdf(file_bytes)
    
    if not raw_text:
        return {"error": "Could not extract text from the PDF. Is it an image-based PDF?"}
        
    extracted_skills = ai_resume_engine.extract_skills(raw_text)

    # Normalize extracted skills using taxonomy lookup for better explainability
    def _normalize_list(skills_list):
        lookup = {}
        for category, skills in SKILLS.items():
            for s in skills:
                lookup[s["name"].lower()] = {"canonical": s["name"], "category": category, "demand": s.get("demand", 0.0), "aliases": s.get("aliases", [])}
                for a in s.get("aliases", []):
                    lookup[a.lower()] = {"canonical": s["name"], "category": category, "demand": s.get("demand", 0.0), "aliases": s.get("aliases", [])}
        normalized = []
        for s in skills_list:
            key = s.lower()
            meta = lookup.get(key)
            if meta:
                normalized.append({"canonical": meta["canonical"], "raw": s, "category": meta["category"], "demand": meta["demand"], "confidence": 0.8})
            else:
                normalized.append({"canonical": s, "raw": s, "category": None, "demand": 0.0, "confidence": 0.5})
        # dedupe by canonical
        seen = {}
        for n in normalized:
            seen[n["canonical"].lower()] = n
        return list(seen.values())

    normalized = _normalize_list(extracted_skills)
    skills_text = " ".join([s["canonical"] for s in normalized])
    match_score = ai_resume_engine.calculate_match_score(skills_text, target_job_description)

    # Per-skill explainability: whether skill appears in job description (exact or alias)
    jd_lower = target_job_description.lower()
    for s in normalized:
        s["matched_in_job_description"] = (s["canonical"].lower() in jd_lower) or any(a.lower() in jd_lower for a in (s.get("aliases") or []))

    boost = len([s for s in normalized if s.get("matched_in_job_description")]) * 5
    final_score = min(100.0, match_score + boost)

    return {
        "filename": resume.filename,
        "match_score": final_score,
        "extracted_skills": normalized,
        "explainability": {
            "match_algo": "sentence-transformers (semantic) + exact alias matching",
            "skill_count": len(normalized),
            "matched_skills": [s for s in normalized if s.get("matched_in_job_description")],
            "missing_skills": [s for s in normalized if not s.get("matched_in_job_description")]
        },
        "summary": f"Your resume is an {final_score}% match for this role based on semantic AI analysis."
    }


@router.post("/resume/analyze_text")
async def analyze_resume_text(payload: ResumeTextRequest):
    """Analyze plain text resume content for quick smoke tests (avoids PDF uploads)."""
    raw_text = payload.text
    if not raw_text or len(raw_text.strip()) < 5:
        raise HTTPException(status_code=400, detail="Empty resume text provided.")

    extracted_skills = ai_resume_engine.extract_skills(raw_text)
    normalized = []
    # reuse normalization logic
    def _normalize_quick(skills_list):
        lookup = {}
        for category, skills in SKILLS.items():
            for s in skills:
                lookup[s["name"].lower()] = {"canonical": s["name"], "category": category, "demand": s.get("demand", 0.0), "aliases": s.get("aliases", [])}
                for a in s.get("aliases", []):
                    lookup[a.lower()] = {"canonical": s["name"], "category": category, "demand": s.get("demand", 0.0), "aliases": s.get("aliases", [])}
        normalized_local = []
        for s in skills_list:
            key = s.lower()
            meta = lookup.get(key)
            if meta:
                normalized_local.append({"canonical": meta["canonical"], "raw": s, "category": meta["category"], "demand": meta["demand"], "confidence": 0.8, "aliases": meta.get("aliases", [])})
            else:
                normalized_local.append({"canonical": s, "raw": s, "category": None, "demand": 0.0, "confidence": 0.5, "aliases": []})
        seen = {}
        for n in normalized_local:
            seen[n["canonical"].lower()] = n
        return list(seen.values())

    normalized = _normalize_quick(extracted_skills)
    skills_text = " ".join([s["canonical"] for s in normalized])
    match_score = ai_resume_engine.calculate_match_score(skills_text, payload.target_job_description)

    jd_lower = payload.target_job_description.lower()
    for s in normalized:
        s["matched_in_job_description"] = (s["canonical"].lower() in jd_lower) or any(a.lower() in jd_lower for a in s.get("aliases", []))

    boost = len([s for s in normalized if s.get("matched_in_job_description")]) * 5
    final_score = min(100.0, match_score + boost)

    return {
        "match_score": final_score,
        "extracted_skills": normalized,
        "explainability": {
            "match_algo": "sentence-transformers (semantic) + exact alias matching",
            "skill_count": len(normalized)
        },
        "summary": f"Your resume text is an {final_score}% match for this role based on semantic AI analysis."
    }


# ==========================================
# 5. MOCK INTERVIEW AI ROUTES
# ==========================================
@router.post("/interview/start")
def start_interview(req: InterviewStart, current_user: User = Depends(get_current_student)):
    questions = mock_interview_engine.generate_questions(req.role, req.round_type)
    return {"questions": questions}

@router.post("/interview/evaluate")
def evaluate_interview(req: InterviewEvaluate, current_user: User = Depends(get_current_student)):
    feedback = mock_interview_engine.evaluate_answer(req.question, req.answer, req.role)
    return feedback

@router.post("/interview/transcribe")
async def transcribe_audio(audio: UploadFile = File(...)):
    """Local Whisper AI Transcription (No external API keys required)"""
    # Lazy-import the whisper package and load the model on first request
    global whisper_model
    try:
        whisper = importlib.import_module("whisper")
    except Exception:
        raise HTTPException(status_code=500, detail="Whisper package is not installed in the environment.")

    if whisper_model is None:
        # Prefer model from env, fallback to base then tiny for smaller/dev setups
        model_name = os.environ.get("WHISPER_MODEL", "base")
        try:
            whisper_model = whisper.load_model(model_name)
        except Exception as e:
            try:
                # fallback to tiny for quicker downloads / low-resource environments
                whisper_model = whisper.load_model("tiny")
            except Exception as e2:
                raise HTTPException(status_code=500, detail=f"Failed to load Whisper models: {e} / {e2}")

    try:
        # Create a safe temporary file to store the incoming audio
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_audio:
            content = await audio.read()
            temp_audio.write(content)
            temp_audio_path = temp_audio.name

        print(f"Transcribing audio file...")
        result = whisper_model.transcribe(temp_audio_path)

        # Clean up temporary file
        if os.path.exists(temp_audio_path):
            os.remove(temp_audio_path)

        return {"text": result["text"].strip()}

    except Exception as e:
        print(f"Transcription Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to transcribe audio: {str(e)}")

@router.post("/interview/grade")
async def grade_interview(submission: InterviewSubmission):
    """Smart AI grading engine — scores answers per round type with detailed feedback."""
    import re
    
    ans = submission.answer.strip()
    ans_lower = ans.lower()
    role = submission.role.lower()
    round_type = (submission.round_type or "Technical").lower()
    question = submission.question.lower()
    word_count = len(ans.split())

    score = 2  # base
    pros = []
    cons = []

    # ── LENGTH / COMPLETENESS ──────────────────────────────────────────
    if word_count < 15:
        cons.append("Your answer is too brief. Aim for at least 2-3 sentences.")
    elif word_count < 40:
        score += 1
        cons.append("Try to elaborate more — interviewers appreciate structured, detailed answers.")
    elif word_count < 100:
        score += 2
        pros.append("Good answer length — sufficient detail without padding.")
    else:
        score += 3
        pros.append("Excellent depth and detail in your response.")

    # ── ROUND-SPECIFIC SCORING ─────────────────────────────────────────
    if "dsa" in round_type or "coding" in round_type or "algorithm" in round_type:
        # Look for CS concepts
        tc_keywords = ["o(n", "o(log", "time complexity", "space complexity", "big o"]
        ds_keywords = ["array", "linked list", "tree", "graph", "stack", "queue", "hash", "heap", "trie", "dp", "recursion", "dynamic programming"]
        technique_keywords = ["two pointer", "sliding window", "binary search", "bfs", "dfs", "backtracking", "greedy", "divide and conquer", "memoization"]

        if any(k in ans_lower for k in tc_keywords):
            score += 2
            pros.append("Great — you mentioned time/space complexity which is crucial for DSA rounds.")
        else:
            cons.append("Always mention the time and space complexity of your solution.")

        ds_hits = [k for k in ds_keywords if k in ans_lower]
        if ds_hits:
            score += 1
            pros.append(f"Good use of data structure knowledge ({', '.join(ds_hits[:2])}).")
        
        tech_hits = [k for k in technique_keywords if k in ans_lower]
        if tech_hits:
            score += 1
            pros.append(f"Excellent — you mentioned algorithmic techniques: {', '.join(tech_hits[:2])}.")
        elif not ds_hits:
            cons.append("Describe which data structure or algorithm approach you would use.")

    elif "system design" in round_type or "design" in round_type:
        design_keywords = ["scalab", "load balanc", "database", "cache", "redis", "cdn", "microservice", "api", "queue", "kafka", "partition", "replat", "availability", "consistency", "cap theorem", "sharding", "sql", "nosql"]
        arch_keywords = ["architecture", "component", "service", "layer", "tier", "distributed", "fault toleran", "high availability"]
        
        design_hits = [k for k in design_keywords if k in ans_lower]
        arch_hits = [k for k in arch_keywords if k in ans_lower]
        
        if len(design_hits) >= 3:
            score += 3
            pros.append(f"Excellent system thinking — you covered key design concepts ({', '.join(design_hits[:3])}).")
        elif len(design_hits) >= 1:
            score += 1
            pros.append(f"Good start with design terminology.")
            cons.append("Expand on more components: load balancing, caching, database choices, and scalability trade-offs.")
        else:
            cons.append("System design answers should mention scalability, databases, caching strategies, and trade-offs.")

        if arch_hits:
            score += 1
            pros.append("Good high-level architectural thinking.")
        else:
            cons.append("Structure your answer around components: frontend → API gateway → services → database → cache.")

    elif "hr" in round_type or "behavioral" in round_type or "behavioural" in round_type:
        star_keywords = ["situation", "task", "action", "result", "challenge", "overcame", "learned", "achieved", "team", "collaboration", "conflict", "resolved"]
        
        star_hits = [k for k in star_keywords if k in ans_lower]
        
        if len(star_hits) >= 3:
            score += 3
            pros.append("Excellent use of structured storytelling — your answer flows well.")
        elif len(star_hits) >= 1:
            score += 1
            pros.append("Good attempt at structured answer.")
            cons.append("Use the STAR format: Situation → Task → Action → Result. Give specific examples.")
        else:
            cons.append("Structure your answer using STAR: Situation, Task, Action, Result with a real example from your experience.")

        if any(word in ans_lower for word in ["i", "we", "my", "our"]):
            score += 1
            pros.append("Good use of first-person — makes your answer personal and authentic.")

        if "result" in ans_lower or "achieved" in ans_lower or "improved" in ans_lower or "%" in ans_lower:
            score += 1
            pros.append("Great — you quantified or referenced results, which is very impactful in HR rounds.")
        else:
            cons.append("Quantify outcomes where possible — e.g., 'improved team velocity by 30%' or 'delivered 2 weeks early'.")

    else:  # Technical / default
        technical_keywords = ["api", "rest", "database", "sql", "nosql", "framework", "library", "algorithm", "architecture", "microservice", "docker", "git", "test", "deploy", "ci/cd", "agile", "async", "http", "json", "jwt", "oauth"]
        
        tech_hits = [k for k in technical_keywords if k in ans_lower]
        
        if len(tech_hits) >= 4:
            score += 3
            pros.append(f"Strong technical vocabulary — you covered concepts well ({', '.join(tech_hits[:3])}).")
        elif len(tech_hits) >= 2:
            score += 2
            pros.append("Good technical depth in your response.")
        elif len(tech_hits) >= 1:
            score += 1
            cons.append("Add more technical specifics — mention relevant technologies, patterns, or trade-offs.")
        else:
            cons.append("For technical rounds, use specific technology names, design patterns, and real-world references.")

        if any(word in ans_lower for word in ["because", "since", "reason", "tradeoff", "trade-off", "advantage", "disadvantage", "however", "alternatively"]):
            score += 1
            pros.append("Good reasoning — you explained 'why', not just 'what'.")

    # ── CAP SCORE ─────────────────────────────────────────────────────
    final_score = min(10, max(1, score))
    if not pros:
        pros = ["You attempted to answer the question."]
    if not cons:
        cons = ["Good answer overall — try adding more specific examples or references."]

    # Build single feedback string for frontend
    feedback_text = ". ".join(pros) + " | Areas to improve: " + ". ".join(cons)

    return {
        "score": final_score,
        "feedback": feedback_text,
        "feedback_positive": pros,
        "feedback_negative": cons,
    }


# ==========================================
# 6. PHOTO UPLOAD (Cloudinary)
# ==========================================
@router.post("/photo")
async def upload_photo_route(file: UploadFile = File(...), current_user: User = Depends(get_current_student), db: Session = Depends(get_db)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed")
    file_bytes = await file.read()
    url = upload_photo(file_bytes, str(current_user.id))
    if not url:
        raise HTTPException(status_code=503, detail="File upload service unavailable. Configure Cloudinary in .env")
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if profile:
        profile.photo_url = url
        db.commit()
    current_user.avatar_url = url
    db.commit()
    return {"photo_url": url, "message": "Photo uploaded successfully"}


# ==========================================
# 7. CERTIFICATIONS
# ==========================================
@router.get("/certifications")
def list_certifications(current_user: User = Depends(get_current_student), db: Session = Depends(get_db)):
    certs = db.query(Certification).filter(Certification.student_id == current_user.id).all()
    return certs

@router.post("/certifications")
def add_certification(req: CertificationCreate, current_user: User = Depends(get_current_student), db: Session = Depends(get_db)):
    import uuid
    cert = Certification(
        id=uuid.uuid4(), student_id=current_user.id, tenant_id=current_user.current_tenant_id,
        name=req.name, issuer=req.issuer, issue_date=req.issue_date, credential_url=req.credential_url
    )
    db.add(cert); db.commit(); db.refresh(cert)
    return cert

@router.delete("/certifications/{cert_id}")
def delete_certification(cert_id: str, current_user: User = Depends(get_current_student), db: Session = Depends(get_db)):
    import uuid
    cert = db.query(Certification).filter(Certification.id == uuid.UUID(cert_id), Certification.student_id == current_user.id).first()
    if not cert: raise HTTPException(status_code=404, detail="Not found")
    db.delete(cert); db.commit()
    return {"message": "Deleted"}


# ==========================================
# 8. HACKATHONS
# ==========================================
@router.get("/hackathons")
def list_hackathons(current_user: User = Depends(get_current_student), db: Session = Depends(get_db)):
    return db.query(Hackathon).filter(Hackathon.student_id == current_user.id).all()

@router.post("/hackathons")
def add_hackathon(req: HackathonCreate, current_user: User = Depends(get_current_student), db: Session = Depends(get_db)):
    import uuid
    h = Hackathon(
        id=uuid.uuid4(), student_id=current_user.id, tenant_id=current_user.current_tenant_id,
        event_name=req.event_name, position=req.position, year=req.year,
        description=req.description, proof_url=req.proof_url
    )
    db.add(h); db.commit(); db.refresh(h)
    return h

@router.delete("/hackathons/{hack_id}")
def delete_hackathon(hack_id: str, current_user: User = Depends(get_current_student), db: Session = Depends(get_db)):
    import uuid
    h = db.query(Hackathon).filter(Hackathon.id == uuid.UUID(hack_id), Hackathon.student_id == current_user.id).first()
    if not h: raise HTTPException(status_code=404, detail="Not found")
    db.delete(h); db.commit()
    return {"message": "Deleted"}


# ==========================================
# 9. RESUME UPLOAD (Cloudinary)
# ==========================================
@router.post("/resume/upload")
async def upload_resume_file(file: UploadFile = File(...), current_user: User = Depends(get_current_student), db: Session = Depends(get_db)):
    if not file.filename or not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    file_bytes = await file.read()
    url = upload_resume_cloud(file_bytes, str(current_user.id))
    if not url:
        raise HTTPException(status_code=503, detail="File upload service unavailable. Configure Cloudinary in .env")
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if profile:
        profile.resume_url = url
        db.commit()
    # Also parse the resume for skills
    try:
        parsed = resume_parser.parse(file_bytes)
        return {"resume_url": url, "message": "Resume uploaded", "extracted_skills": parsed.get("skills", [])}
    except Exception:
        return {"resume_url": url, "message": "Resume uploaded (skill extraction skipped)"}


# ==========================================
# 10. LEARNING PATH & KNOWLEDGE GRAPH
# ==========================================
@router.get("/learning-path")
def get_learning_path(career: str = "Software Engineer", current_user: User = Depends(get_current_student), db: Session = Depends(get_db)):
    """Returns a personalised learning path based on career goal, current skills, and Graph DB syllabus gaps."""
    from app.core.graph import get_missing_skills_for_job, get_syllabus_topics
    
    # 1. Get student profile details for Graph traversal
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    branch = profile.branch if profile and profile.branch else "CSE"
    year = profile.year_of_study if profile and profile.year_of_study else 3
    
    # 2. Get current skills from profile
    student_skills_db = db.query(StudentSkill).filter(StudentSkill.student_id == current_user.id).all()
    
    # 3. Define target skills (in production this comes from a Job Description parsing pipeline)
    target_skills = []
    if "data" in career.lower():
        target_skills = ["Python", "SQL", "Pandas", "Machine Learning", "Tableau", "AWS"]
    elif "frontend" in career.lower():
        target_skills = ["JavaScript", "React", "Next.js", "CSS", "HTML", "TypeScript"]
    else:
        target_skills = ["Java", "Spring Boot", "React", "Docker", "Kubernetes", "SQL", "Data Structures"]
        
    # 4. Query the Graph Database!
    missing_from_syllabus = get_missing_skills_for_job(db, branch, year, target_skills)
    topics_taught = get_syllabus_topics(db, branch, year)
    
    return {
        "career": career,
        "branch": branch,
        "year": year,
        "topics_taught": topics_taught,
        "missing_from_syllabus": missing_from_syllabus,
        "target_skills": target_skills,
        "message": f"Graph DB analyzed {branch} Year {year} syllabus. Found {len(missing_from_syllabus)} skill gaps for {career}.",
        "phases": [
            {
                "title": "Knowledge Graph Gaps",
                "desc": f"Skills required for {career} that are NOT in your {branch} syllabus.",
                "skills": missing_from_syllabus
            }
        ]
    }