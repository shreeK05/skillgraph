# file: ml/recommender/skill_gap.py
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

class SkillGapCalculator:
    def calculate(self, student_skills: list[str], required_skills: list[dict]) -> dict:
        """
        student_skills: ["Python", "Docker", "AWS"]
        required_skills: [{"name": "Python", "importance": "must"}, {"name": "React", "importance": "nice"}]
        """
        if not required_skills:
            return {"match_pct": 100, "missing_skills": []}

        # Normalize to lowercase for safe matching
        req_skill_names = [s["name"].lower() for s in required_skills]
        student_skills_lower = [s.lower() for s in student_skills]

        # Create a unified vocabulary of all unique skills in this comparison
        all_skills = list(set(student_skills_lower + req_skill_names))

        # Build one-hot encoded vectors (1 if they have the skill, 0 if not)
        student_vec = [1 if s in student_skills_lower else 0 for s in all_skills]
        required_vec = [1 if s in req_skill_names else 0 for s in all_skills]

        # Calculate Cosine Similarity (Returns a value between 0.0 and 1.0)
        similarity = cosine_similarity([student_vec], [required_vec])[0][0]
        match_pct = similarity * 100

        # Identify what the student is missing
        missing = [r for r in required_skills if r["name"].lower() not in student_skills_lower]
        
        # Sort so "must have" skills appear at the top of their learning path
        missing.sort(key=lambda x: x.get("importance", "nice") == "must", reverse=True)

        return {
            "match_pct": round(match_pct),
            "missing_skills": missing
        }