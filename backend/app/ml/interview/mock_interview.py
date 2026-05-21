# file: ml/interview/mock_interview.py
import os
import json
from groq import Groq
from dotenv import load_dotenv

# Force Python to read the .env file in your backend folder
load_dotenv()

class MockInterviewEngine:
    def __init__(self):
        # Groq provides lightning-fast inference for Llama 3.1
        api_key = os.environ.get("GROQ_API_KEY")
        if not api_key:
            print("WARNING: GROQ_API_KEY is missing from your .env file!")
            
        self.client = Groq(api_key=api_key)
        self.model = "llama-3.1-8b-instant"
        
    def generate_questions(self, role: str, round_type: str) -> list:
        prompt = f"""Generate 5 {round_type} interview questions for a {role} role at a product company.
        Return ONLY a valid JSON array of question strings. No markdown formatting, just the raw JSON."""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7
            )
            content = response.choices[0].message.content
            if content.startswith("```json"):
                content = content.replace("```json", "").replace("```", "").strip()
            return json.loads(content)
        except Exception as e:
            print(f"Error generating questions: {e}")
            return [f"Tell me about your experience related to a {role} role.", "What is your greatest strength?"]

    def evaluate_answer(self, question: str, answer: str, role: str) -> dict:
        prompt = f"""Evaluate this interview answer.
        Question: {question}
        Candidate Answer: {answer}
        Role: {role}
        Score it from 0-10 on accuracy, clarity, and structure.
        Return ONLY valid JSON in this exact format:
        {{"score": 8, "feedback": "Detailed feedback here", "model_answer": "An ideal answer here"}}
        No markdown, just raw JSON."""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3
            )
            content = response.choices[0].message.content
            if content.startswith("```json"):
                content = content.replace("```json", "").replace("```", "").strip()
            return json.loads(content)
        except Exception as e:
            print(f"Error evaluating answer: {e}")
            return {"score": 0, "feedback": f"Error processing answer. Details: {e}", "model_answer": ""}