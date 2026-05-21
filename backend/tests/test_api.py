import json
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

def test_health():
    r = client.get("/api/v1/health")
    assert r.status_code == 200
    data = r.json()
    assert data.get("status") == "ok"

def test_analyze_text_endpoint():
    payload = {
        "text": "Jane Doe\nSkilled in Python, React, AWS, Docker, and Redis.",
        "target_job_description": "Full Stack Engineer with Python and React experience"
    }
    r = client.post("/api/v1/student/resume/analyze_text", json=payload)
    assert r.status_code == 200
    data = r.json()
    assert "match_score" in data
    assert isinstance(data["extracted_skills"], list)
