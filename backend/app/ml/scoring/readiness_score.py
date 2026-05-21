# file: ml/scoring/readiness_score.py
import xgboost as xgb
import joblib
import shap
import os
import numpy as np
import pandas as pd

FEATURES = ["skill_match_pct", "cgpa_normalized", "project_count",
            "certification_count", "mock_interview_avg", "resume_completeness"]

MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
MODEL_PATH = os.path.join(MODEL_DIR, "readiness_model.pkl")

class PlacementReadinessScorer:
    def __init__(self):
        os.makedirs(MODEL_DIR, exist_ok=True)

    def train_dummy_model(self):
        """Trains a baseline model using synthetic data so the system works immediately."""
        print("Training baseline XGBoost Readiness Model...")
        np.random.seed(42)
        # Generate synthetic data for 500 students
        X = np.random.rand(500, len(FEATURES)) * 100
        # Simple logic: if their average feature score > 50, they are "placed" (1), else (0)
        y = (np.mean(X, axis=1) > 50).astype(int)

        df = pd.DataFrame(X, columns=FEATURES)

        model = xgb.XGBClassifier(n_estimators=100, max_depth=4)
        model.fit(df, y)

        joblib.dump(model, MODEL_PATH)
        print("Baseline model trained and saved successfully!")

    def predict(self, features: dict) -> dict:
        # If no model exists yet, train the dummy one instantly
        if not os.path.exists(MODEL_PATH):
            self.train_dummy_model()

        model = joblib.load(MODEL_PATH)

        # Prepare the input vector
        X_input = pd.DataFrame([[features.get(f, 0) for f in FEATURES]], columns=FEATURES)

        # Predict probability of placement (Class 1)
        score_proba = model.predict_proba(X_input)[0][1]
        score_out_of_100 = round(score_proba * 100)

        # SHAP provides the exact mathematical reason WHY they got this score
        explainer = shap.TreeExplainer(model)
        shap_vals = explainer.shap_values(X_input)

        # Format the explanation for the frontend UI
        explanation = {}
        for i, feature in enumerate(FEATURES):
            # Safely extract the impact value
            val = shap_vals[0][i] if isinstance(shap_vals, np.ndarray) else shap_vals[0][i]
            explanation[feature] = round(float(val), 3)

        return {
            "score": score_out_of_100,
            "explanation": explanation
        }