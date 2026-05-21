# file: backend/app/api/routes/company.py
from fastapi import APIRouter, Body
from pydantic import BaseModel
from app.ml.resume_engine import ai_resume_engine

router = APIRouter()

class JobPosting(BaseModel):
    title: str
    description: str

# Simulated Database of Student Profiles (Parsed from their resumes)
STUDENT_DB = [
    {
        "id": "VIT-001", 
        "name": "Shreeyash Kamble", 
        "college": "VIT Pune", 
        "role": "Software Engineer", 
        "skills_text": "Python React Next.js AWS Docker FastAPI Machine Learning C++ DevOps"
    },
    {
        "id": "VIT-042", 
        "name": "Aayush Sharma", 
        "college": "VIT Pune", 
        "role": "Backend Engineer", 
        "skills_text": "Java Spring Boot MySQL AWS Docker Linux"
    },
    {
        "id": "VIT-115", 
        "name": "Janhavi Patel", 
        "college": "VIT Pune", 
        "role": "Data Scientist", 
        "skills_text": "Python TensorFlow PyTorch NLP Data Structures Neo4j Pandas"
    }
]

@router.post("/candidates/rank")
async def rank_candidates(job: JobPosting):
    """
    Receives a job description and ranks all students in the database
    based on semantic AI similarity to the job requirements.
    """
    ranked_students = []
    
    for student in STUDENT_DB:
        # 1. Calculate the base semantic match score
        score = ai_resume_engine.calculate_match_score(student["skills_text"], job.description)
        
        # 2. Add the ATS exact-keyword boost
        skills_list = student["skills_text"].split()
        boost = len([s for s in skills_list if s.lower() in job.description.lower()]) * 5
        final_score = min(100.0, score + boost)
        
        # 3. Format the response object
        ranked_students.append({
            "id": student["id"],
            "name": student["name"],
            "role": student["role"],
            "college": student["college"],
            "match": round(final_score, 1),
            "skills": skills_list[:4], # Send top 4 skills for the UI badge
            "status": "Shortlisted" if final_score >= 85 else "Pending"
        })
        
    # 4. Sort the list from highest match to lowest match
    ranked_students.sort(key=lambda x: x["match"], reverse=True)
    
    return {
        "job_title": job.title,
        "total_applicants": len(STUDENT_DB),
        "ai_shortlisted": len([s for s in ranked_students if s["match"] >= 85]),
        "candidates": ranked_students
    }