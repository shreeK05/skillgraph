# file: backend/app/models/__init__.py
from app.core.database import Base
from app.models.college import College
from app.models.user import User
from app.models.student import StudentProfile, Certification, Hackathon, InterviewSession
from app.models.skill import Skill, StudentSkill
from app.models.job import JobPosting
from app.models.drive import Drive, Application
from app.models.syllabus import Syllabus, Announcement
from app.models.company import CompanyProfile
from app.models.graph import GraphConcept, GraphRelation