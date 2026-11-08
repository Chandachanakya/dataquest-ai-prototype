"""
End-to-End Validation Script for Phase 3
Tests:
1. Feature Parity between Python and TypeScript across 7 Scenarios
2. ML Inference with live Random Forest and Logistic Regression models
3. Four-State Classification & Distribution Axiomatic Normalization
4. Edge cases & error handling
"""

import os
import sys
import json
import math
from datetime import datetime, timedelta, timezone
import numpy as np
import pandas as pd
import joblib

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
API_DIR = os.path.join(BASE_DIR, "..", "api")
MODEL_DIR = os.path.join(BASE_DIR, "..", "ml_pipeline", "models")
sys.path.insert(0, API_DIR)

from inference import (
    FEATURE_ORDER,
    FEATURE_DEFAULTS,
    sanitize_feature_value,
    extract_features,
    predict_drop_risk,
    classify_risk,
)
from schemas import DropRiskRequest

DATASET_MEDIAN_TIME = 599.0

# ── Reference Time Anchor (UTC) ──
REF_TIME = datetime(2026, 11, 8, 12, 0, 0, tzinfo=timezone.utc)

# Define 7 Test Scenarios with exact raw attempts
SCENARIOS = {
    "1. New learner (no attempts)": {
        "attempts": [],
        "persona": "new"
    },
    "2. Active learner (high scores)": {
        "attempts": [
            {"quest_id": "q1", "diff": 2, "score": 90, "completed": True, "time": 420, "days_ago": 5.0},
            {"quest_id": "q2", "diff": 2, "score": 85, "completed": True, "time": 400, "days_ago": 4.0},
            {"quest_id": "q3", "diff": 2, "score": 95, "completed": True, "time": 450, "days_ago": 3.0},
            {"quest_id": "q4", "diff": 2, "score": 90, "completed": True, "time": 390, "days_ago": 2.0},
            {"quest_id": "q5", "diff": 2, "score": 100, "completed": True, "time": 410, "days_ago": 1.0},
            {"quest_id": "q6", "diff": 2, "score": 95, "completed": True, "time": 430, "days_ago": 0.2},
        ],
        "persona": "fast"
    },
    "3. Low scores & frequent retries": {
        "attempts": [
            {"quest_id": "q1", "diff": 2, "score": 30, "completed": False, "time": 700, "days_ago": 3.5},
            {"quest_id": "q1", "diff": 2, "score": 25, "completed": False, "time": 800, "days_ago": 3.0},
            {"quest_id": "q1", "diff": 2, "score": 40, "completed": False, "time": 750, "days_ago": 2.8},
            {"quest_id": "q1", "diff": 2, "score": 35, "completed": True,  "time": 850, "days_ago": 2.5},
            {"quest_id": "q2", "diff": 2, "score": 45, "completed": False, "time": 900, "days_ago": 1.8},
            {"quest_id": "q2", "diff": 2, "score": 30, "completed": False, "time": 950, "days_ago": 1.2},
            {"quest_id": "q2", "diff": 2, "score": 20, "completed": False, "time": 600, "days_ago": 0.8},
            {"quest_id": "q2", "diff": 2, "score": 35, "completed": True,  "time": 920, "days_ago": 0.4},
        ],
        "persona": "struggling"
    },
    "4. Inconsistent scores": {
        "attempts": [
            {"quest_id": "q1", "diff": 1, "score": 100, "completed": True,  "time": 300, "days_ago": 4.5},
            {"quest_id": "q2", "diff": 2, "score": 20,  "completed": True,  "time": 700, "days_ago": 3.8},
            {"quest_id": "q3", "diff": 3, "score": 95,  "completed": True,  "time": 400, "days_ago": 2.5},
            {"quest_id": "q4", "diff": 2, "score": 15,  "completed": False, "time": 900, "days_ago": 1.2},
            {"quest_id": "q5", "diff": 1, "score": 80,  "completed": True,  "time": 500, "days_ago": 0.3},
        ],
        "persona": "consistent"
    },
    "5. Inactive for several days": {
        "attempts": [
            {"quest_id": "q1", "diff": 1, "score": 80, "completed": True, "time": 500, "days_ago": 18.0},
            {"quest_id": "q2", "diff": 1, "score": 75, "completed": True, "time": 550, "days_ago": 16.5},
            {"quest_id": "q3", "diff": 2, "score": 85, "completed": True, "time": 520, "days_ago": 15.0},
        ],
        "persona": "drop_risk"
    },
    "6. Incomplete quests (abandoned)": {
        "attempts": [
            {"quest_id": "q1", "diff": 1, "score": 20, "completed": False, "time": 300, "days_ago": 4.0},
            {"quest_id": "q2", "diff": 2, "score": 30, "completed": False, "time": 400, "days_ago": 3.0},
            {"quest_id": "q3", "diff": 2, "score": 10, "completed": False, "time": 250, "days_ago": 2.0},
            {"quest_id": "q4", "diff": 3, "score": 25, "completed": False, "time": 350, "days_ago": 1.5},
            {"quest_id": "q5", "diff": 1, "score": 15, "completed": False, "time": 200, "days_ago": 0.5},
        ],
        "persona": "struggling"
    },
    "7. Multiple attempts on same quest": {
        "attempts": [
            {"quest_id": "q1", "diff": 2, "score": 40, "completed": False, "time": 800, "days_ago": 4.0},
            {"quest_id": "q1", "diff": 2, "score": 55, "completed": False, "time": 750, "days_ago": 3.0},
            {"quest_id": "q1", "diff": 2, "score": 70, "completed": True,  "time": 620, "days_ago": 2.0},
            {"quest_id": "q1", "diff": 2, "score": 85, "completed": True,  "time": 580, "days_ago": 1.0},
            {"quest_id": "q1", "diff": 2, "score": 95, "completed": True,  "time": 500, "days_ago": 0.2},
        ],
        "persona": "struggling"
    },
    "8. Consistent learner (steady pace)": {
        "attempts": [
            {"quest_id": "q1", "diff": 1, "score": 70, "completed": True,  "time": 550, "days_ago": 6.0},
            {"quest_id": "q2", "diff": 1, "score": 68, "completed": True,  "time": 560, "days_ago": 5.0},
            {"quest_id": "q3", "diff": 1, "score": 72, "completed": True,  "time": 580, "days_ago": 4.0},
            {"quest_id": "q4", "diff": 2, "score": 65, "completed": False, "time": 620, "days_ago": 3.0},
            {"quest_id": "q4", "diff": 2, "score": 70, "completed": True,  "time": 590, "days_ago": 2.0},
            {"quest_id": "q5", "diff": 2, "score": 68, "completed": True,  "time": 570, "days_ago": 1.0},
            {"quest_id": "q6", "diff": 2, "score": 72, "completed": True,  "time": 560, "days_ago": 0.3},
        ],
        "persona": "consistent"
    }
}


def python_compute_features(attempts, ref_time=REF_TIME):
    """Calculates the 10 features according to engineer_features.py."""
    if not attempts:
        return {
            'days_since_last_active': 30.0,
            'activity_frequency': 0.0,
            'average_score': 0.0,
            'total_attempts': 0.0,
            'completion_time_vs_median': 1.0,
            'retry_ratio': 1.0,
            'score_variance': 0.0,
            'recent_xp_velocity': 0.0,
            'completion_rate': 0.0,
            'avg_difficulty': 1.0,
            'raw_avg_score': 0.0
        }

    # Transform attempts to timestamps
    rows = []
    for a in attempts:
        ts = ref_time - timedelta(days=a['days_ago'])
        rows.append({
            'quest_id': a['quest_id'],
            'difficulty': a['diff'],
            'score': a['score'],
            'completed': 1 if a['completed'] else 0,
            'completion_time': a['time'],
            'timestamp': ts
        })
    df = pd.DataFrame(rows).sort_values('timestamp')

    latest_ts = df['timestamp'].max()
    total_att = len(df)
    unique_quests = df['quest_id'].nunique()

    # 1. days_since_last_active
    days_since_last_active = (ref_time - latest_ts).total_seconds() / 86400.0

    # 2. activity_frequency (in 30 days)
    window_start = ref_time - timedelta(days=30)
    activity_frequency = float(df[df['timestamp'] >= window_start]['timestamp'].dt.date.nunique())

    # 3. average_score (difficulty-normalized: (score / (diff * 10)) * 100)
    avg_score = float((df['score'] / (df['difficulty'] * 10)).mean() * 100)
    raw_avg_score = float(df['score'].mean())

    # 4. total_attempts
    total_attempts = float(total_att)

    # 5. completion_time_vs_median (using completed attempts if any, else 1.0)
    completed_df = df[df['completed'] == 1]
    if len(completed_df) > 0:
        mean_comp_time = completed_df['completion_time'].mean()
        completion_time_vs_median = mean_comp_time / DATASET_MEDIAN_TIME
    else:
        completion_time_vs_median = 1.0

    # 6. retry_ratio
    retry_ratio = total_att / unique_quests if unique_quests > 0 else 1.0

    # 7. score_variance (sample std dev ddof=1)
    score_variance = float(df['score'].std(ddof=1)) if total_att > 1 else 0.0

    # 8. recent_xp_velocity (scores in last 7 days / 7.0)
    recent_window = ref_time - timedelta(days=7)
    recent_df = df[df['timestamp'] >= recent_window]
    recent_xp_velocity = float(recent_df['score'].sum() / 7.0)

    # 9. completion_rate
    completion_rate = float(df['completed'].sum() / total_att) if total_att > 0 else 0.0

    # 10. avg_difficulty
    avg_difficulty = float(df['difficulty'].mean())

    return {
        'days_since_last_active': round(days_since_last_active, 2),
        'activity_frequency': activity_frequency,
        'average_score': round(avg_score, 2),
        'total_attempts': total_attempts,
        'completion_time_vs_median': round(completion_time_vs_median, 4),
        'retry_ratio': round(retry_ratio, 4),
        'score_variance': round(score_variance, 2),
        'recent_xp_velocity': round(recent_xp_velocity, 4),
        'completion_rate': round(completion_rate, 4),
        'avg_difficulty': round(avg_difficulty, 2),
        'raw_avg_score': round(raw_avg_score, 1)
    }


def ts_calculate_metrics_simulation(attempts, ref_time_ms):
    """
    Exact simulation of TypeScript learnerEngine.ts `calculateMetrics()` logic.
    """
    thirty_days_ms = 30 * 24 * 60 * 60 * 1000
    cutoff_ms = ref_time_ms - thirty_days_ms

    safe_attempts = []
    for a in attempts:
        started_ms = ref_time_ms - int(a['days_ago'] * 86400 * 1000)
        if started_ms >= cutoff_ms:
            safe_attempts.append({
                "quest_id": a['quest_id'],
                "difficulty": a['diff'],
                "score": a['score'],
                "status": "completed" if a['completed'] else "failed",
                "completion_time": a['time'],
                "started_at_ms": started_ms,
                "date_str": datetime.fromtimestamp(started_ms / 1000, tz=timezone.utc).strftime('%Y-%m-%d')
            })

    total_attempts = len(safe_attempts)
    completed_attempts = [a for a in safe_attempts if a['status'] == 'completed']
    successful_completions = len(completed_attempts)

    # 1. days_since_last_active
    if safe_attempts:
        max_ms = max(a['started_at_ms'] for a in safe_attempts)
        days_since_last_active = max(0.0, (ref_time_ms - max_ms) / (1000 * 60 * 60 * 24))
    else:
        days_since_last_active = 30.0

    # 2. activity_frequency
    active_dates = set(a['date_str'] for a in safe_attempts)
    activity_frequency = float(len(active_dates))

    # 3. average_score
    raw_score_sum = sum(a['score'] for a in safe_attempts)
    norm_score_sum = sum((a['score'] / (a['difficulty'] * 10)) * 100 for a in safe_attempts)
    avg_score = (raw_score_sum / total_attempts) if total_attempts > 0 else 0.0
    normalized_avg_score = (norm_score_sum / total_attempts) if total_attempts > 0 else 0.0

    # 5. completion_time_vs_median
    completed_with_time = [a for a in completed_attempts if a.get('completion_time') and a['completion_time'] > 0]
    mean_comp_time = (sum(a['completion_time'] for a in completed_with_time) / len(completed_with_time)) if completed_with_time else DATASET_MEDIAN_TIME
    completion_time_vs_median = mean_comp_time / DATASET_MEDIAN_TIME

    # 6. retry_ratio
    unique_quests_count = len(set(a['quest_id'] for a in safe_attempts))
    retry_ratio = (total_attempts / unique_quests_count) if unique_quests_count > 0 else 1.0

    # 7. score_variance
    score_variance = 0.0
    if total_attempts > 1:
        variance_sum = sum((a['score'] - avg_score) ** 2 for a in safe_attempts)
        score_variance = math.sqrt(variance_sum / (total_attempts - 1))

    # 8. recent_xp_velocity
    seven_days_ms = 7 * 24 * 60 * 60 * 1000
    seven_days_ago_ms = ref_time_ms - seven_days_ms
    recent_attempts = [a for a in safe_attempts if a['started_at_ms'] >= seven_days_ago_ms]
    recent_score_sum = sum(a['score'] for a in recent_attempts)
    recent_xp_velocity = recent_score_sum / 7.0

    # 9. completion_rate
    completion_rate = (successful_completions / total_attempts) if total_attempts > 0 else 0.0

    # 10. avg_difficulty
    sum_difficulty = sum(a['difficulty'] for a in safe_attempts)
    avg_difficulty = (sum_difficulty / total_attempts) if total_attempts > 0 else 1.0

    return {
        'days_since_last_active': round(days_since_last_active, 2),
        'activity_frequency': activity_frequency,
        'average_score': round(normalized_avg_score, 2),
        'total_attempts': float(total_attempts),
        'completion_time_vs_median': round(completion_time_vs_median, 4),
        'retry_ratio': round(retry_ratio, 4),
        'score_variance': round(score_variance, 2),
        'recent_xp_velocity': round(recent_xp_velocity, 4),
        'completion_rate': round(completion_rate, 4),
        'avg_difficulty': round(avg_difficulty, 2),
        'raw_avg_score': round(avg_score, 1)
    }


def derive_ts_four_state(drop_prob, raw_avg_score, completion_rate, total_attempts):
    """Exact TypeScript four-state derivation from learnerEngine.ts."""
    drop_prob = max(0.0, min(1.0, drop_prob))
    perf_ratio = max(0.0, min(1.0, raw_avg_score / 100.0))
    comp_rate = max(0.0, min(1.0, completion_rate))

    # 1. State classification
    if drop_prob >= 0.70:
        state = 'DROP_RISK'
    elif drop_prob >= 0.40:
        state = 'STRUGGLING'
    else:
        if raw_avg_score >= 75 and comp_rate >= 0.70 and total_attempts > 0:
            state = 'FAST'
        else:
            state = 'CONSISTENT'

    # 2. Probability distribution weights
    raw_weights = {
        'DROP_RISK': max(0.01, (drop_prob ** 1.5) * 3.0),
        'STRUGGLING': max(0.01, (1.0 - perf_ratio) * (0.6 + 2.0 * max(0.0, 0.4 - abs(drop_prob - 0.5)))),
        'FAST': max(0.01, (1.0 - drop_prob) * (perf_ratio ** 2) * (2.5 if comp_rate >= 0.7 else 0.8)),
        'CONSISTENT': max(0.01, (1.0 - drop_prob) * (1.0 - abs(perf_ratio - 0.7) * 0.8) + 0.15)
    }
    total_w = sum(raw_weights.values())
    dist = {k: round(v / total_w, 4) for k, v in raw_weights.items()}

    # Residue correction so sum is exactly 1.0000
    residue = round(1.0 - sum(dist.values()), 4)
    dist[state] = round(dist[state] + residue, 4)

    # Margin and confidence
    sorted_probs = sorted(dist.values(), reverse=True)
    margin = sorted_probs[0] - sorted_probs[1]
    confidence = min(1.0, max(0.1, round(margin * 2 + 0.2, 2)))

    return state, dist, confidence


def run_full_validation():
    print("=" * 80)
    print("DATAQUEST AI — PHASE 3 END-TO-END VALIDATION REPORT")
    print("=" * 80)

    # Load models
    rf_model_path = os.path.join(MODEL_DIR, "drop_risk_rf_v1.pkl")
    lr_model_path = os.path.join(MODEL_DIR, "drop_risk_lr_v1.pkl")
    rf_model = joblib.load(rf_model_path)
    lr_model = joblib.load(lr_model_path)
    print(f"Loaded Random Forest model from: {rf_model_path}")
    print(f"Loaded Logistic Regression model from: {lr_model_path}\n")

    results = []

    for name, data in SCENARIOS.items():
        print("-" * 80)
        print(f"Scenario: {name}")
        attempts = data["attempts"]
        ref_time_ms = int(REF_TIME.timestamp() * 1000)

        # 1. Feature Engineering
        py_feats = python_compute_features(attempts)
        ts_feats = ts_calculate_metrics_simulation(attempts, ref_time_ms)

        # Check parity feature by feature
        print(f"{'Feature':<28} | {'Python':<10} | {'TypeScript':<10} | {'Delta':<10} | {'Status'}")
        print("-" * 75)

        max_delta = 0.0
        for f in FEATURE_ORDER:
            py_v = py_feats[f]
            ts_v = ts_feats[f]
            delta = abs(py_v - ts_v)
            if delta > max_delta:
                max_delta = delta
            status = "MATCH (<=1e-4)" if delta <= 0.0001 else ("CLOSE (<=0.01)" if delta <= 0.01 else "MISMATCH")
            print(f"{f:<28} | {py_v:<10.4f} | {ts_v:<10.4f} | {delta:<10.4f} | {status}")

        print(f"Max feature delta: {max_delta:.6f}")

        # 2. Model Inference
        # Prepare vector
        vec_py = np.array([[py_feats[f] for f in FEATURE_ORDER]], dtype=float)
        rf_prob = predict_drop_risk(rf_model, vec_py)
        lr_prob = predict_drop_risk(lr_model, vec_py)
        rf_risk = classify_risk(rf_prob)

        print(f"\nModel Predictions:")
        print(f"  Random Forest Drop Risk Prob: {rf_prob:.4f} ({rf_risk.upper()} risk)")
        print(f"  Logistic Regression Prob:    {lr_prob:.4f}")

        # 3. Four-State Classification
        state, dist, conf = derive_ts_four_state(
            drop_prob=rf_prob,
            raw_avg_score=ts_feats['raw_avg_score'],
            completion_rate=ts_feats['completion_rate'],
            total_attempts=ts_feats['total_attempts']
        )
        dist_sum = sum(dist.values())
        print(f"\nFour-State Classification Result:")
        print(f"  Assigned Primary State: {state}")
        print(f"  Confidence Margin:      {conf:.2f}")
        print(f"  State Distribution:     {dist}")
        print(f"  Sum of Distribution:    {dist_sum:.4f} (Valid: {abs(dist_sum - 1.0) < 1e-4})")

        results.append({
            "scenario": name,
            "py_features": py_feats,
            "ts_features": ts_feats,
            "max_delta": max_delta,
            "rf_prob": rf_prob,
            "lr_prob": lr_prob,
            "rf_risk": rf_risk,
            "state": state,
            "confidence": conf,
            "distribution": dist,
            "dist_sum": dist_sum
        })

    # Summary table
    print("\n" + "=" * 80)
    print("EXECUTIVE SUMMARY TABLE")
    print("=" * 80)
    print(f"{'Scenario':<34} | {'RF Prob':<8} | {'Risk':<6} | {'State':<11} | {'Conf':<5} | {'Sum(P)'}")
    print("-" * 80)
    for r in results:
        print(f"{r['scenario']:<34} | {r['rf_prob']:<8.4f} | {r['rf_risk']:<6} | {r['state']:<11} | {r['confidence']:<5.2f} | {r['dist_sum']:.4f}")

    # Output JSON for reporting
    with open(os.path.join(BASE_DIR, "validation_results.json"), "w") as f:
        json.dump(results, f, indent=2)
    print("\nValidation results saved to validation_results.json")


if __name__ == "__main__":
    run_full_validation()
