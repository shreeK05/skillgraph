# file: backend/ml/resume_engine.py
import io
import time
from threading import Lock

import PyPDF2
import spacy
from sentence_transformers import SentenceTransformer, util

class ResumeEngine:
    def __init__(self):
        print("Initializing NLP Engine for Resume Parsing...")
        try:
            # Load spaCy for text extraction and Named Entity Recognition
            self.nlp = spacy.load("en_core_web_sm")
            # Load Sentence-BERT for semantic similarity matching
            self.encoder = SentenceTransformer("all-MiniLM-L6-v2")
            self._skills_cache = {}
            self._match_cache = {}
            self._cache_lock = Lock()
            self._cache_ttl_seconds = 3600
            print("NLP Engine Online!")
        except Exception as e:
            print(f"Failed to load NLP models: {e}")
            self.nlp = None
            self.encoder = None

    def extract_text_from_pdf(self, file_bytes: bytes) -> str:
        """Reads a PDF file in memory and extracts all text."""
        reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
        text = ""
        for page in reader.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + " "
        return text.strip()

    def extract_skills(self, text: str) -> list:
        """Uses spaCy NLP and keyword matching to extract clean technical skills."""
        if not self.nlp:
            return []

        cache_key = text.strip().lower()
        with self._cache_lock:
            cached = self._skills_cache.get(cache_key)
            if cached and (time.time() - cached[0] < self._cache_ttl_seconds):
                return list(cached[1])
        
        # 1. Clean noisy PDF characters (bullets, weird spacing)
        clean_text = text.replace('•', ' ').replace('\n', ' ').replace('\t', ' ')
        doc = self.nlp(clean_text)
        
        skills = set()
        
        # 2. Extract strictly Proper Nouns (e.g., Python, AWS, Docker)
        for token in doc:
            if token.pos_ == "PROPN" and len(token.text) > 2:
                skills.add(token.text.strip(" ,.-()"))
                
        # 3. Exact Tech Phrase Matching (to catch multi-word skills)
        tech_keywords = [
            "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", 
            "FastAPI", "Next.js", "React.js", "Node.js", "C++", "Java", 
            "JavaScript", "HTML", "CSS", "Natural Language Processing", 
            "Data Structures", "Kubernetes", "DevOps", "Neo4j", "React", "AWS"
        ]
        
        for tech in tech_keywords:
            if tech.lower() in clean_text.lower():
                skills.add(tech)

        # 4. Filter out generic resume words and limit string length
        ignore_list = [
            'institute', 'engineering', 'science', 'computer', 'intern', 
            'projects', 'pune', 'experience', 'university', 'technology',
            'specialization', 'graduation', 'documents', 'environments',
            'b.tech', 'campus', 'education', 'innovators', 'autonomous', 
            'bot', 'inc', 'tech', 'software'
        ]
        
        final_skills = []
        for skill in skills:
            # Keep only reasonably sized words that aren't in the ignore list
            if (2 < len(skill) < 25) and (skill.lower() not in ignore_list):
                final_skills.append(skill)
                
        # Return ALL clean, sorted skills (no alphabetical cut-off!)
        result = sorted(list(set(final_skills)))
        with self._cache_lock:
            self._skills_cache[cache_key] = (time.time(), result)
        return result

    def calculate_match_score(self, resume_text: str, job_description: str) -> float:
        """Uses Sentence-BERT to calculate how closely the resume matches the job."""
        if not self.encoder:
            return 0.0

        cache_key = f"{resume_text.strip().lower()}||{job_description.strip().lower()}"
        with self._cache_lock:
            cached = self._match_cache.get(cache_key)
            if cached and (time.time() - cached[0] < self._cache_ttl_seconds):
                return cached[1]

        # Convert text into high-dimensional vector embeddings
        resume_embedding = self.encoder.encode(resume_text, convert_to_tensor=True)
        job_embedding = self.encoder.encode(job_description, convert_to_tensor=True)

        # Calculate Cosine Similarity between the two vectors
        cosine_score = util.cos_sim(resume_embedding, job_embedding).item()
        
        # Convert to a percentage (0 to 100)
        match_percentage = round(cosine_score * 100, 2)
        
        # Ensure it doesn't dip below 0 mathematically
        score = max(0.0, match_percentage)
        with self._cache_lock:
            self._match_cache[cache_key] = (time.time(), score)
        return score

# Create a lazy proxy that initializes the heavy ResumeEngine only on first use
class _LazyResumeEngine:
    def __init__(self):
        self._engine = None

    def _ensure(self):
        if self._engine is None:
            self._engine = ResumeEngine()

    def __getattr__(self, name):
        self._ensure()
        return getattr(self._engine, name)


# Exported object for importers to use without triggering heavy model loads at import-time
ai_resume_engine = _LazyResumeEngine()