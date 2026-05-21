"""Seed the PostgreSQL database with sample users, skills and student profiles.
Run this after starting Postgres and setting DATABASE_URL in .env.
"""
from app.core.database import engine, Base, SessionLocal
from app.models.skill import Skill
from app.models.college import College
from app.models.user import User
from app.models.student import StudentProfile
from sqlalchemy.exc import OperationalError


def create_tables():
    Base.metadata.create_all(bind=engine)


def seed():
    try:
        create_tables()
        db = SessionLocal()

        # Add sample college (tenant)
        sample_college_name = "Vishwakarma Institute of Technology"
        sample_subdomain = "vit"
        college = db.query(College).filter((College.name == sample_college_name) | (College.subdomain == sample_subdomain)).first()
        if not college:
            college = College(name=sample_college_name, subdomain=sample_subdomain)
            db.add(college)
            db.commit()
            db.refresh(college)

        # Add sample skills
        skills = [
            {"name": "Python", "category": "Programming", "demand_score": 9.5},
            {"name": "React", "category": "Web", "demand_score": 8.5},
            {"name": "AWS", "category": "Cloud", "demand_score": 9.0},
            {"name": "Docker", "category": "DevOps", "demand_score": 8.7},
        ]

        for s in skills:
            exists = db.query(Skill).filter(Skill.name == s["name"]).first()
            if not exists:
                db.add(Skill(name=s["name"], category=s["category"], demand_score=s["demand_score"]))

        db.commit()

        # Add a sample user and student profile
        sample_email = "student1@vit.edu"
        exists_user = db.query(User).filter(User.email == sample_email).first()
        if not exists_user:
            user = User(tenant_id=college.id, email=sample_email, hashed_password="pbkdf2:fake", role="STUDENT")
            db.add(user)
            db.commit()
            db.refresh(user)

            profile = StudentProfile(user_id=user.id, tenant_id=user.tenant_id, cgpa=8.5, branch="CSE", graduation_year=2025)
            db.add(profile)
            db.commit()

        print("Database seeding complete.")

    except OperationalError as e:
        print("Database connection failed. Make sure Postgres is running and DATABASE_URL is correct.")
        print(str(e))


if __name__ == "__main__":
    seed()
