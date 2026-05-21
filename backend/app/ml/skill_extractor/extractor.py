# file: ml/skill_extractor/extractor.py
import spacy
import os
import sys

# Add the root directory to the Python path so we can import skills_taxonomy
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from app.ml.skill_extractor.skills_taxonomy import SKILLS

class SkillExtractor:
    def __init__(self):
        print("Loading spaCy NLP model (en_core_web_sm)...")
        self.nlp = spacy.load("en_core_web_sm")
        
        # Add the EntityRuler to the NLP pipeline
        # In spaCy 3.x, we add it before the standard Named Entity Recognizer (NER)
        self.ruler = self.nlp.add_pipe("entity_ruler", before="ner")
        
        # Build matching patterns from our taxonomy dictionary
        patterns = []
        # Build a reverse lookup for normalization (alias/name -> canonical)
        self._lookup = {}
        for category, skills in SKILLS.items():
            for skill in skills:
                canonical = skill["name"]
                # add canonical name to lookup
                self._lookup[canonical.lower()] = {
                    "canonical": canonical,
                    "category": category,
                    "demand_score": skill.get("demand", 0.0)
                }
                patterns.append({"label": "SKILL", "pattern": canonical})
                for alias in skill.get("aliases", []):
                    patterns.append({"label": "SKILL", "pattern": alias})
                    self._lookup[alias.lower()] = {
                        "canonical": canonical,
                        "category": category,
                        "demand_score": skill.get("demand", 0.0),
                        "alias": alias
                    }

        self.ruler.add_patterns(patterns)

    def extract(self, text: str) -> list[dict]:
        doc = self.nlp(text)
        extracted_skills = []

        for ent in doc.ents:
            if ent.label_ == "SKILL":
                raw = ent.text.strip()
                key = raw.lower()
                normalized = self._lookup.get(key)
                if normalized:
                    entry = {
                        "name": normalized["canonical"],
                        "matched_alias": raw if raw.lower() != normalized["canonical"].lower() else None,
                        "category": normalized.get("category"),
                        "demand_score": normalized.get("demand_score", 0.0),
                        "confidence": 0.95
                    }
                else:
                    entry = {
                        "name": raw,
                        "matched_alias": None,
                        "category": None,
                        "demand_score": 0.0,
                        "confidence": 0.6
                    }
                extracted_skills.append(entry)

        # Deduplicate by canonical name (case-insensitive)
        unique_skills = {}
        for s in extracted_skills:
            unique_skills[s["name"].lower()] = s
        return list(unique_skills.values())

# Quick testing block
if __name__ == "__main__":
    extractor = SkillExtractor()
    sample_text = "I am a backend developer with 3 years of experience in Python, FastAPI, and Docker. I also know a bit of reactjs and AWS."
    print(f"\nAnalyzing text: '{sample_text}'")
    print("\nExtracted Skills:")
    print(extractor.extract(sample_text))