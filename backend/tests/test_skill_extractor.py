from ml.skill_extractor.extractor import SkillExtractor


def test_skill_extractor_basic():
    extractor = SkillExtractor()
    sample_text = "Experienced in Python, FastAPI, Docker, and AWS cloud deployments."
    skills = extractor.extract(sample_text)
    # normalize keys to lower for assertion
    names = [s["name"].lower() for s in skills]
    assert "python" in names or any(s["canonical"].lower() == "python" for s in skills)
