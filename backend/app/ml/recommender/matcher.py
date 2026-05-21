# file: ml/recommender/matcher.py
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

class CandidateMatcher:
    def __init__(self):
        print("Loading Sentence-BERT model (all-MiniLM-L6-v2)... This might take a few seconds.")
        # This is a free, highly efficient open-source model from HuggingFace (approx 80MB)
        self.model = SentenceTransformer("all-MiniLM-L6-v2")

    def rank_candidates(self, jd_text: str, candidates: list[dict]) -> list:
        """
        jd_text: "Looking for a backend engineer who knows Python, APIs, and databases."
        candidates: [{"student": "Sai", "skills_text": "I know Python and FastAPI"}]
        """
        if not candidates:
            return []

        # 1. Convert the Job Description into a mathematical vector (embedding)
        jd_embedding = self.model.encode([jd_text])
        
        # 2. Convert all students' skills into vectors simultaneously
        student_texts = [c["skills_text"] for c in candidates]
        student_embeddings = self.model.encode(student_texts)

        # 3. Compute cosine similarity for all students against the JD at once
        scores = cosine_similarity(jd_embedding, student_embeddings)[0]

        # 4. Attach scores and rank them descending
        ranked = []
        for idx, candidate in enumerate(candidates):
            candidate_data = candidate.copy()
            candidate_data["match_pct"] = round(scores[idx] * 100)
            ranked.append(candidate_data)

        # Sort highest match first
        ranked.sort(key=lambda x: x["match_pct"], reverse=True)
        return ranked

# Quick testing block
if __name__ == "__main__":
    matcher = CandidateMatcher()
    
    job_description = "We need a frontend developer experienced in React.js, Tailwind CSS, and modern UI design."
    
    student_pool = [
        {"student": "Student A", "skills_text": "Backend dev using Python, Django, and PostgreSQL."},
        {"student": "Student B", "skills_text": "Frontend engineer. I build UIs with React, Next.js, and Tailwind."},
        {"student": "Student C", "skills_text": "Data Scientist working with Machine Learning and TensorFlow."}
    ]
    
    print(f"\nJob Description: '{job_description}'")
    print("\nRanking Candidates...")
    results = matcher.rank_candidates(job_description, student_pool)
    
    for rank, res in enumerate(results, 1):
        print(f"Rank {rank}: {res['student']} (Match: {res['match_pct']}%)")