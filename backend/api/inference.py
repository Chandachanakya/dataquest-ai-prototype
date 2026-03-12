"""
Inference logic for DataQuest AI ML API.
Extracts feature vectors and generates predictions.
Imported by main.py.
"""

import numpy as np
from typing import Dict, Any, List, Tuple

from schemas import DropRiskRequest


# ─────────────────────────────────────────────────────────────────────────────
# Feature Extraction
# ─────────────────────────────────────────────────────────────────────────────

FEATURE_ORDER = [
    'days_since_last_active',
    'activity_frequency',
    'average_score',
    'total_attempts',
    'completion_time_vs_median',
    'retry_ratio',
    'score_variance',
    'recent_xp_velocity',
    'completion_rate',
    'avg_difficulty',
]

FEATURE_DEFAULTS = {
    'days_since_last_active': 0.0,
    'activity_frequency': 0.0,
    'average_score': 0.0,
    'total_attempts': 0.0,
    'completion_time_vs_median': 1.0,
    'retry_ratio': 1.0,
    'score_variance': 0.0,
    'recent_xp_velocity': 0.0,
    'completion_rate': 0.5,
    'avg_difficulty': 3.0,
}


def extract_features(request: DropRiskRequest) -> np.ndarray:
    """
    Build a 1×10 numpy feature array from a DropRiskRequest.

    Priority:
    1. `request.features` dict (if provided)
    2. Individual top-level fields
    3. Defaults from FEATURE_DEFAULTS
    """
    values: Dict[str, float] = {}

    if request.features:
        # Merge provided dict with defaults for missing keys
        for feat in FEATURE_ORDER:
            values[feat] = request.features.get(feat, FEATURE_DEFAULTS[feat])
    else:
        # Use individual fields; fall back to defaults for None/missing
        field_map = {
            'days_since_last_active': request.days_since_last_active,
            'activity_frequency': request.activity_frequency,
            'average_score': request.average_score,
            'total_attempts': request.total_attempts,
            'completion_time_vs_median': request.completion_time_vs_median,
            'retry_ratio': request.retry_ratio,
            'score_variance': request.score_variance,
            'recent_xp_velocity': request.recent_xp_velocity,
            'completion_rate': request.completion_rate,
            'avg_difficulty': request.avg_difficulty,
        }
        for feat in FEATURE_ORDER:
            raw = field_map.get(feat)
            values[feat] = float(raw) if raw is not None else FEATURE_DEFAULTS[feat]

    vector = np.array([values[f] for f in FEATURE_ORDER], dtype=float)
    return vector.reshape(1, -1), values


# ─────────────────────────────────────────────────────────────────────────────
# Drop Risk Prediction
# ─────────────────────────────────────────────────────────────────────────────

def predict_drop_risk(model, features: np.ndarray) -> float:
    """
    Return drop-risk probability using the loaded sklearn model.
    """
    return float(model.predict_proba(features)[0][1])


def mock_drop_risk(features: np.ndarray) -> float:
    """Heuristic fallback when no model is available."""
    days = features[0][0]
    freq = features[0][1]
    if days > 10:
        return 0.85
    elif days > 7:
        return 0.65
    elif freq < 3:
        return 0.45
    return 0.15


def classify_risk(probability: float) -> str:
    """Convert probability to textual risk level."""
    if probability >= 0.7:
        return "high"
    elif probability >= 0.4:
        return "medium"
    return "low"


# ─────────────────────────────────────────────────────────────────────────────
# Intervention Recommendation
# ─────────────────────────────────────────────────────────────────────────────

def mock_intervention(context: Dict[str, Any]) -> Tuple[str, float, str]:
    """
    Rule-based intervention recommendation (placeholder until bandit model trained).

    Returns (intervention_type, expected_reward, reason).
    """
    state_dist = context.get('learner_state_distribution', {})

    if state_dist.get('Drop-risk', 0) > 0.5:
        return "encouragement", 0.70, "User showing drop-risk signals"
    elif state_dist.get('Struggling', 0) > 0.5:
        return "hint", 0.80, "User is struggling with current content"
    elif context.get('fatigue_score', 0) > 0.7:
        return "break", 0.60, "User showing signs of fatigue"

    return "encouragement", 0.50, "Maintaining engagement"


# ─────────────────────────────────────────────────────────────────────────────
# Quest Sequencing
# ─────────────────────────────────────────────────────────────────────────────

def mock_next_quest(
    available_quests: List[Dict[str, Any]],
    user_state: Dict[str, Any],
) -> Tuple[str, float, str]:
    """
    Simple heuristic quest sequencer (placeholder until sequencing model trained).

    Returns (quest_id, expected_reward, reason).
    """
    avg_score = user_state.get('average_score', 50)

    # Prefer easier quests when scoring below 60, harder when above 80
    difficulty_pref = (
        "beginner" if avg_score < 60 else
        "advanced" if avg_score > 80 else
        "intermediate"
    )

    for quest in available_quests:
        if quest.get('difficulty') == difficulty_pref:
            return quest.get('id', 'quest-1'), 0.80, \
                f"Selected {difficulty_pref} quest based on performance (score={avg_score:.0f})"

    # Fallback: first available quest
    if available_quests:
        q = available_quests[0]
        return q.get('id', 'quest-1'), 0.65, "Default first available quest"

    return "quest-1", 0.50, "No quests available; using default"
