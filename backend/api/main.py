"""
FastAPI Microservice for ML Predictions
Provides endpoints for drop risk prediction, intervention recommendation, and quest sequencing.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import joblib
from datetime import datetime
import os
import sys

# ── Ensure the api/ directory is on sys.path so local imports (schemas, inference)
#    resolve to the right files regardless of where uvicorn is launched from.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import schemas and inference logic from dedicated modules
from schemas import (
    DropRiskRequest, DropRiskResponse,
    InterventionRequest, InterventionResponse,
    NextQuestRequest, NextQuestResponse,
)
from inference import (
    extract_features,
    predict_drop_risk, mock_drop_risk, classify_risk,
    mock_intervention,
    mock_next_quest,
)

# ─────────────────────────────────────────────────────────────────────────────
# App Initialization
# ─────────────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="DataQuest AI - ML API",
    description="Machine Learning inference API for adaptive personalization",
    version="1.0.0",
)

# Get allowed origins from environment variable or use defaults
allowed_origins = [
    "http://localhost:5173",   # Vite default
    "http://localhost:3000",   # React default
    "http://localhost:8080",   # Current dev server
    "https://dataquest-ai-prototype.vercel.app", # Vercel frontend
]

# Add Vercel URL if provided in environment
frontend_url = os.getenv("ALLOWED_ORIGIN")
if frontend_url:
    allowed_origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────────────────────────────────────
# Model Loading
# ─────────────────────────────────────────────────────────────────────────────

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "..", "ml_pipeline", "models")

try:
    drop_risk_model = joblib.load(f"{MODEL_DIR}/drop_risk_rf_v1.pkl")
    MODEL_VERSION = "random_forest_v1"
    USE_REAL_MODEL = True
    print("[OK] Loaded trained Random Forest model")
except FileNotFoundError:
    try:
        drop_risk_model = joblib.load(f"{MODEL_DIR}/drop_risk_lr_v1.pkl")
        MODEL_VERSION = "logistic_regression_v1"
        USE_REAL_MODEL = True
        print("[OK] Loaded trained Logistic Regression model")
    except FileNotFoundError:
        print("[WARNING] No trained models found. Using mock predictions.")
        drop_risk_model = None
        MODEL_VERSION = "mock_v1"
        USE_REAL_MODEL = False


# ─────────────────────────────────────────────────────────────────────────────
# Endpoints
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "service": "DataQuest AI - ML API",
        "status": "healthy",
        "version": "1.0.0",
        "model_version": MODEL_VERSION,
        "using_real_model": USE_REAL_MODEL,
        "timestamp": datetime.now().isoformat(),
    }


@app.post("/predict/drop-risk", response_model=DropRiskResponse)
async def predict_drop_risk_endpoint(request: DropRiskRequest):
    """
    Predict drop risk for a user.

    Returns probability of user dropping out (0–1) and risk level classification.
    """
    try:
        features, feature_dict = extract_features(request)
        total_attempts = feature_dict.get('total_attempts', 0.0)

        # Cold-start policy: exactly zero lifetime attempts is a new learner.
        # Returning learners retain their history regardless of attempt count.
        if total_attempts == 0.0:
            return DropRiskResponse(
                user_id=request.user_id,
                probability=0.0,
                risk_level="low",
                model_version=f"{MODEL_VERSION}:cold_start",
                timestamp=datetime.now().isoformat(),
                features_used=feature_dict,
            )

        if USE_REAL_MODEL and drop_risk_model is not None:
            probability = predict_drop_risk(drop_risk_model, features)
        else:
            probability = mock_drop_risk(features)

        return DropRiskResponse(
            user_id=request.user_id,
            probability=probability,
            risk_level=classify_risk(probability),
            model_version=MODEL_VERSION,
            timestamp=datetime.now().isoformat(),
            features_used=feature_dict,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


@app.post("/predict/intervention", response_model=InterventionResponse)
async def predict_intervention_endpoint(request: InterventionRequest):
    """
    Recommend intervention for a user based on context.

    Uses contextual bandit approach (heuristic fallback until CB model trained).
    """
    try:
        intervention_type, expected_reward, reason = mock_intervention(request.context)

        return InterventionResponse(
            user_id=request.user_id,
            intervention_type=intervention_type,
            expected_reward=expected_reward,
            confidence=0.75,
            reason=reason,
            model_version=MODEL_VERSION,
            timestamp=datetime.now().isoformat(),
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Intervention prediction failed: {str(e)}")


@app.post("/predict/next-quest", response_model=NextQuestResponse)
async def predict_next_quest_endpoint(request: NextQuestRequest):
    """
    Recommend next quest for a user.

    Uses supervised policy learning (heuristic fallback until sequencing model trained).
    """
    try:
        quest_id, expected_reward, reason = mock_next_quest(
            request.available_quests,
            request.user_state,
        )

        return NextQuestResponse(
            user_id=request.user_id,
            quest_id=quest_id,
            expected_reward=expected_reward,
            reason=reason,
            model_version=MODEL_VERSION,
            timestamp=datetime.now().isoformat(),
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quest prediction failed: {str(e)}")


# ─────────────────────────────────────────────────────────────────────────────
# Entry Point
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
