# file: backend/app/core/ml.py
import importlib
import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../')))

print("Booting up AI Models... (initializing lazy proxies)")

# Lazy proxies to avoid heavy model loading at import-time
class _LazyProxy:
	def __init__(self, module_path, class_name):
		self._module_path = module_path
		self._class_name = class_name
		self._inst = None

	def _ensure(self):
		if self._inst is None:
			module = importlib.import_module(self._module_path)
			cls = getattr(module, self._class_name)
			self._inst = cls()

	def __getattr__(self, name):
		self._ensure()
		return getattr(self._inst, name)

resume_parser = _LazyProxy("ml.skill_extractor.resume_parser", "ResumeParser")
candidate_matcher = _LazyProxy("ml.recommender.matcher", "CandidateMatcher")
skill_gap_calculator = _LazyProxy("ml.recommender.skill_gap", "SkillGapCalculator")
mock_interview_engine = _LazyProxy("ml.interview.mock_interview", "MockInterviewEngine")
readiness_scorer = _LazyProxy("ml.scoring.readiness_score", "PlacementReadinessScorer")

print("AI model proxies ready (models load on first use)")