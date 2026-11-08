"""
Pydantic schemas for DataQuest AI ML API.
All request/response models live here, imported by main.py and inference.py.
"""

from pydantic import BaseModel
from typing import Optional, Dict, Any, List


# ─────────────────────────────────────────────────────────────────────────────
# Drop Risk
# ─────────────────────────────────────────────────────────────────────────────

class DropRiskRequest(BaseModel):
    """Request schema for drop-risk prediction."""
    user_id: str
    features: Optional[Dict[str, float]] = None
    # Individual feature fields (used when `features` dict is not supplied)
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
    """Response schema for drop-risk prediction."""
    model_config = {"protected_namespaces": ()}
    user_id: str
    probability: float
    risk_level: str          # "low" | "medium" | "high"
    model_version: str
    timestamp: str
    features_used: Dict[str, float]


# ─────────────────────────────────────────────────────────────────────────────
# Intervention
# ─────────────────────────────────────────────────────────────────────────────

class InterventionRequest(BaseModel):
    """Request schema for intervention recommendation."""
    user_id: str
    context: Dict[str, Any]
    # Expected context keys:
    #   learner_state_distribution: {state_name: probability}
    #   recent_performance: float  (0-100 score)
    #   fatigue_score: float       (0-1)


class InterventionResponse(BaseModel):
    """Response schema for intervention recommendation."""
    model_config = {"protected_namespaces": ()}
    user_id: str
    intervention_type: str   # "encouragement" | "hint" | "difficulty_decrease" | "break"
    expected_reward: float
    confidence: float
    reason: str
    model_version: str
    timestamp: str


# ─────────────────────────────────────────────────────────────────────────────
# Quest Sequencing
# ─────────────────────────────────────────────────────────────────────────────

class NextQuestRequest(BaseModel):
    """Request schema for next-quest recommendation."""
    user_id: str
    available_quests: List[Dict[str, Any]]
    user_state: Dict[str, Any]


class NextQuestResponse(BaseModel):
    """Response schema for next-quest recommendation."""
    model_config = {"protected_namespaces": ()}
    user_id: str
    quest_id: str
    expected_reward: float
    reason: str
    model_version: str
    timestamp: str
