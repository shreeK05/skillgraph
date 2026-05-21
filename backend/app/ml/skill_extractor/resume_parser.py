# file: ml/skill_extractor/resume_parser.py
import fitz  # PyMuPDF
import re
import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
from app.ml.skill_extractor.extractor import SkillExtractor

class ResumeParser:
    def __init__(self):
        self.extractor = SkillExtractor()

    def extract_email(self, text: str) -> str:
        # Basic regex to find an email address
        match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
        return match.group(0) if match else None

    def extract_phone(self, text: str) -> str:
        # Basic regex to find an Indian/International phone number
        match = re.search(r'\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}', text)
        return match.group(0) if match else None

    def parse(self, pdf_bytes: bytes) -> dict:
        # 1. Open the PDF from raw bytes
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        
        # 2. Extract text from every page
        text = " ".join([page.get_text() for page in doc])
        
        # 3. Parse the data
        return {
            "email": self.extract_email(text),
            "phone": self.extract_phone(text),
            "skills": self.extractor.extract(text),
            "raw_text_length": len(text)
        }