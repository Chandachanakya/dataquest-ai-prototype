"""
FastAPI Microservice for ML Predictions
Provides endpoints for drop risk prediction, intervention recommendation, and quest sequencing.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import joblib
import numpy as np
from datetime import datetime
import os

# Initialize FastAPI app
app = FastAPI(
    title="DataQuest AI - ML API",
    description="Machine Learning inference API for adaptive personalization",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite default
        "http://localhost:3000",  # React default
        "http://localhost:8080",  # Current dev server
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Model directory
MODEL_DIR = "../ml_pipeline/models"

# Load models (with fallback to mock models if not available)
try:
    # Try to load Random Forest model (trained in Phase 2)
    drop_risk_model = joblib.load(f"{MODEL_DIR}/drop_risk_rf_v1.pkl")
    MODEL_VERSION = "random_forest_v1"
    USE_REAL_MODEL = True
    print("✅ Loaded trained Random Forest model")
except FileNotFoundError:
    try:
        # Fallback to Logistic Regression
        drop_risk_model = joblib.load(f"{MODEL_DIR}/drop_risk_lr_v1.pkl")
        MODEL_VERSION = "logistic_regression_v1"
        USE_REAL_MODEL = True
        print("✅ Loaded trained Logistic Regression model")
    except FileNotFoundError:
        print("⚠️  WARNING: No trained models found. Using mock predictions.")
        drop_risk_model = None
        MODEL_VERSION = "mock_v1"
        USE_REAL_MODEL = False


# ============================================================================
# REQUEST/RESPONSE SCHEMAS
# ============================================================================

class DropRiskRequest(BaseModel):
    """Request schema for drop risk prediction."""
    user_id: str
    features: Optional[Dict[str, float]] = None
    # If features not provided, will use defaults
    days_since_last_active: Optional[float] = None
    activity_frequency: Optional[float] = None
    average_score: Optional[float] = None
    total_attempts: Optional[float] = None
    completion_time_vs_median: Optional[float] = None
    retry_ratio: Optional[float] = None
    score_variance: Optional[float] = None
    recent_xp_velocity: Optional[float] = None
    completion_rate: Optional[float] = None
    avg_difficulty: Optional[float] = None


class DropRiskResponse(BaseModel):
    """Response schema for drop risk prediction."""
    user_id: str
    probability: float
    risk_level: str  # "low", "medium", "high"
    model_version: str
    timestamp: str
    features_used: Dict[str, float]


class InterventionRequest(BaseModel):
    """Request schema for intervention recommendation."""
    user_id: str
    context: Dict[str, Any]
    # Context includes: learner_state_distribution, recent_performance, fatigue_score


class InterventionResponse(BaseModel):
    """Response schema for intervention recommendation."""
    user_id: str
    intervention_type: str  # "encouragement", "hint", "difficulty_decrease", "break"
    expected_reward: float
    confidence: float
    reason: str
    model_version: str
    timestamp: str


class NextQuestRequest(BaseModel):
    """Request schema for next quest recommendation."""
    user_id: str
    available_quests: List[Dict[str, Any]]
    user_state: Dict[str, Any]


class NextQuestResponse(BaseModel):
    """Response schema for next quest recommendation."""
    user_id: str
    quest_id: str
    expected_reward: float
    reason: str
    model_version: str
    timestamp: str


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def extract_features(request: DropRiskRequest) -> np.ndarray:
    """Extract feature vector from request (10 features to match trained model)."""
    if request.features:
        # Use provided features dictionary
        feature_vector = [
            request.features.get('days_since_last_active', 0),
            request.features.get('activity_frequency', 0),
            request.features.get('average_score', 0),
            request.features.get('total_attempts', 0),
            request.features.get('completion_time_vs_median', 1.0),
            request.features.get('retry_ratio', 1.0),
            request.features.get('score_variance', 0),
            request.features.get('recent_xp_velocity', 0),
            request.features.get('completion_rate', 0.5),
            request.features.get('avg_difficulty', 3.0)
        ]
    else:
        # Use individual feature fields
        feature_vector = [
            request.days_since_last_active or 0,
            request.activity_frequency or 0,
            request.average_score or 0,
            request.total_attempts or 0,
            request.completion_time_vs_median or 1.0,
            request.retry_ratio or 1.0,
            request.score_variance or 0,
            request.recent_xp_velocity or 0,
            request.completion_rate or 0.5,
            request.avg_difficulty or 3.0
        ]
    
    return np.array(feature_vector).reshape(1, -1)


def mock_drop_risk_prediction(features: np.ndarray) -> float:
    """Mock drop risk prediction for testing."""
    # Simple heuristic: high risk if days_since_last_active > 7
    days_since_last_active = features[0][0]
    activity_frequency = features[0][1]
    
    if days_since_last_active > 10:
        return 0.85
    elif days_since_last_active > 7:
        return 0.65
    elif activity_frequency < 3:
        return 0.45
    else:
        return 0.15


def mock_intervention_recommendation(context: Dict[str, Any]) -> tuple:
    """Mock intervention recommendation for testing."""
    # Simple rule-based logic
    state_dist = context.get('learner_state_distribution', {})
    
    if state_dist.get('Drop-risk', 0) > 0.5:
        return "encouragement", 0.7, "User showing drop-risk signals"
    elif state_dist.get('Struggling', 0) > 0.5:
        return "hint", 0.8, "User is struggling with current content"
    elif context.get('fatigue_score', 0) > 0.7:
        return "break", 0.6, "User showing signs of fatigue"
    else:
        return "encouragement", 0.5, "Maintaining engagement"


def mock_next_quest_recommendation(available_quests: List[Dict], user_state: Dict) -> tuple:
    """Mock next quest recommendation for testing."""
    # Simple logic: recommend first quest
    if available_quests:
        quest = available_quests[0]
        return quest.get('id', 'quest-1'), 0.75, "Recommended based on difficulty progression"
    return "quest-1", 0.5, "Default recommendation"


# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "service": "DataQuest AI - ML API",
        "status": "healthy",
        "version": "1.0.0",
        "model_version": MODEL_VERSION,
        "using_real_model": USE_REAL_MODEL,
        "timestamp": datetime.now().isoformat()
    }


@app.post("/predict/drop-risk", response_model=DropRiskResponse)
async def predict_drop_risk(request: DropRiskRequest):
    """
    Predict drop risk for a user.
    
    Returns probability of user dropping out (0-1) and risk level classification.
    """
    try:
        # Extract features
        features = extract_features(request)
        feature_dict = {
            'days_since_last_active': features[0][0],
            'activity_frequency': features[0][1],
            'average_score': features[0][2],
            'total_attempts': features[0][3],
            'completion_time_vs_median': features[0][4],
            'retry_ratio': features[0][5],
            'score_variance': features[0][6],
            'recent_xp_velocity': features[0][7],
            'completion_rate': features[0][8],
            'avg_difficulty': features[0][9]
        }
        
        # Predict
        if USE_REAL_MODEL and drop_risk_model is not None:
            probability = float(drop_risk_model.predict_proba(features)[0][1])
        else:
            probability = mock_drop_risk_prediction(features)
        
        # Classify risk level
        if probability >= 0.7:
            risk_level = "high"
        elif probability >= 0.4:
            risk_level = "medium"
        else:
            risk_level = "low"
        
        return DropRiskResponse(
            user_id=request.user_id,
            probability=probability,
            risk_level=risk_level,
            model_version=MODEL_VERSION,
            timestamp=datetime.now().isoformat(),
            features_used=feature_dict
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


@app.post("/predict/intervention", response_model=InterventionResponse)
async def predict_intervention(request: InterventionRequest):
    """
    Recommend intervention for a user based on context.
    
    Uses contextual bandit approach to select best intervention.
    """
    try:
        # Mock implementation (replace with real contextual bandit model)
        intervention_type, expected_reward, reason = mock_intervention_recommendation(request.context)
        
        return InterventionResponse(
            user_id=request.user_id,
            intervention_type=intervention_type,
            expected_reward=expected_reward,
            confidence=0.75,  # Placeholder
            reason=reason,
            model_version=MODEL_VERSION,
            timestamp=datetime.now().isoformat()
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Intervention prediction failed: {str(e)}")


@app.post("/predict/next-quest", response_model=NextQuestResponse)
async def predict_next_quest(request: NextQuestRequest):
    """
    Recommend next quest for a user.
    
    Uses supervised policy learning to select optimal quest.
    """
    try:
        # Mock implementation (replace with real sequencing model)
        quest_id, expected_reward, reason = mock_next_quest_recommendation(
            request.available_quests,
            request.user_state
        )
        
        return NextQuestResponse(
            user_id=request.user_id,
            quest_id=quest_id,
            expected_reward=expected_reward,
            reason=reason,
            model_version=MODEL_VERSION,
            timestamp=datetime.now().isoformat()
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quest prediction failed: {str(e)}")


# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
