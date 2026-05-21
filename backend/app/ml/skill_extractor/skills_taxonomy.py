# file: ml/skill_extractor/skills_taxonomy.py
import os
import sys

# Add the backend directory to the Python path so we can import our database models
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../backend')))

from app.core.database import SessionLocal
from app.models.skill import Skill

# This is a sample of the taxonomy. In production, this grows to 500+ skills.
SKILLS = {
    "Programming Languages": [
        {"name": "Python", "aliases": ["py", "python3"], "demand": 9.5},
        {"name": "JavaScript", "aliases": ["js", "node.js"], "demand": 9.0},
        {"name": "Java", "aliases": ["java8", "java11"], "demand": 8.5},
        {"name": "C++", "aliases": ["cpp", "c plus plus"], "demand": 8.0}
    ],
    "Machine Learning": [
        {"name": "Machine Learning", "aliases": ["ml"], "demand": 9.0},
        {"name": "Deep Learning", "aliases": ["dl"], "demand": 8.8},
        {"name": "PyTorch", "aliases": ["torch"], "demand": 8.5},
        {"name": "TensorFlow", "aliases": ["tf"], "demand": 8.2}
    ],
    "Web Frameworks": [
        {"name": "React", "aliases": ["reactjs", "react.js"], "demand": 9.2},
        {"name": "Next.js", "aliases": ["nextjs", "next"], "demand": 8.9},
        {"name": "FastAPI", "aliases": ["fast-api"], "demand": 8.5}
    ],
    "Cloud & DevOps": [
        {"name": "Docker", "aliases": ["containerization"], "demand": 9.0},
        {"name": "AWS", "aliases": ["amazon web services"], "demand": 9.5},
        {"name": "Kubernetes", "aliases": ["k8s"], "demand": 8.8}
    ]
}

def seed_skills():
    """Insert all skills into PostgreSQL skills table"""
    db = SessionLocal()
    try:
        print("Seeding skills taxonomy into the database...")
        added_count = 0
        for category, skills in SKILLS.items():
            for skill_data in skills:
                # Check if skill already exists to prevent duplicates
                existing = db.query(Skill).filter(Skill.name == skill_data["name"]).first()
                if not existing:
                    new_skill = Skill(
                        name=skill_data["name"],
                        category=category,
                        aliases=skill_data["aliases"],
                        demand_score=skill_data["demand"]
                    )
                    db.add(new_skill)
                    added_count += 1
        db.commit()
        print(f"Successfully seeded {added_count} new skills into the database!")
    except Exception as e:
        print(f"Error seeding skills: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_skills()