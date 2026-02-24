"""
Offline Evaluation Script - Phase 2
Comprehensive evaluation of trained ML models for drop risk prediction.

Handles edge cases:
- Highly imbalanced datasets (uses appropriate metrics/fallbacks)
- Small datasets (reduces CV folds automatically)

Produces:
- K-fold cross-validation results for both models
- Hold-out test set metrics (ROC-AUC, F1, Precision, Recall)
- Feature importance ranking
- Calibration summary
- Saves full report to models/evaluation_report.txt
"""

import pandas as pd
import numpy as np
import joblib
import os
from datetime import datetime
from sklearn.model_selection import StratifiedKFold, KFold, cross_validate, train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    roc_auc_score, f1_score, precision_score, recall_score,
    accuracy_score, confusion_matrix, brier_score_loss
)
import warnings
warnings.filterwarnings('ignore')

# ─────────────────────────────────────────
# Config
# ─────────────────────────────────────────
DATA_PATH   = "data/training_features.csv"
MODEL_DIR   = "models"
REPORT_PATH = f"{MODEL_DIR}/evaluation_report.txt"

FEATURE_COLS = [
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

# ─────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────

def sep(char="=", width=64):
    return char * width


def load_data(path: str):
    df = pd.read_csv(path)
    X = df[FEATURE_COLS].fillna(df[FEATURE_COLS].mean())
    y = df['drop_risk']
    return X, y, df


def load_or_train_model(name: str, X, y):
    """Load saved model if present, otherwise train fresh."""
    pkl_map = {
        "Random Forest": f"{MODEL_DIR}/drop_risk_rf_v1.pkl",
        "Logistic Regression": f"{MODEL_DIR}/drop_risk_lr_v1.pkl",
    }
    path = pkl_map.get(name)
    if path and os.path.exists(path):
        return joblib.load(path)

    print(f"  ⚠  Model file not found for {name}, training fresh copy...")
    if name == "Random Forest":
        m = RandomForestClassifier(
            n_estimators=100, max_depth=10, min_samples_split=5,
            min_samples_leaf=2, class_weight='balanced', random_state=42, n_jobs=-1
        )
    else:
        m = LogisticRegression(max_iter=1000, class_weight='balanced', random_state=42)
    m.fit(X, y)
    return m


def get_cv_strategy(y, target_folds: int = 5):
    """
    Pick the best CV strategy given label distribution.
    - If only one class exists: returns None (CV not possible).
    - If minority class too small for stratified: falls back to KFold.
    - Otherwise: StratifiedKFold.
    """
    n_classes = len(np.unique(y))
    if n_classes < 2:
        return None, "single_class"

    minority_count = int(y.value_counts().min())
    max_folds = min(target_folds, minority_count)

    if max_folds < 2:
        # Not enough minority samples for stratified — use plain KFold
        folds = min(target_folds, len(y) // 5)
        if folds < 2:
            return None, "too_small"
        return KFold(n_splits=folds, shuffle=True, random_state=42), f"KFold({folds})"

    return (
        StratifiedKFold(n_splits=max_folds, shuffle=True, random_state=42),
        f"StratifiedKFold({max_folds})"
    )


# ─────────────────────────────────────────
# Cross-Validation
# ─────────────────────────────────────────

def run_cross_validation(X, y):
    print(f"\n{sep()}")
    cv_obj, cv_label = get_cv_strategy(y)

    if cv_obj is None:
        reason = (
            "Dataset has only one class — all samples have the same drop_risk label.\n"
            "  This is common when training data was generated months ago and all\n"
            "  users appear inactive relative to today's date.\n"
            "  CV is skipped; hold-out and feature importance evaluations still run."
        )
        print(f"  CROSS-VALIDATION — SKIPPED")
        print(f"  Reason: {reason}")
        print(sep())
        return {}

    print(f"  CROSS-VALIDATION  ({cv_label})")
    print(sep())

    scoring = ['roc_auc', 'f1', 'precision', 'recall', 'accuracy']
    models = {
        "Logistic Regression": LogisticRegression(max_iter=1000, class_weight='balanced', random_state=42),
        "Random Forest": RandomForestClassifier(
            n_estimators=100, max_depth=10, min_samples_split=5,
            min_samples_leaf=2, class_weight='balanced', random_state=42, n_jobs=-1),
    }

    all_results = {}
    for name, model in models.items():
        print(f"\n  [{name}]")
        try:
            cv_res = cross_validate(model, X, y, cv=cv_obj, scoring=scoring, n_jobs=-1)
            stats = {}
            for metric in scoring:
                scores = cv_res[f'test_{metric}']
                stats[metric] = scores
                print(f"    {metric:12s}: {scores.mean():.4f} ± {scores.std():.4f}")
            all_results[name] = stats
        except Exception as e:
            print(f"    Skipped ({e})")

    return all_results


# ─────────────────────────────────────────
# Hold-out Test Evaluation
# ─────────────────────────────────────────

def evaluate_on_holdout(X, y):
    print(f"\n{sep()}")
    print("  HOLD-OUT TEST SET EVALUATION  (80/20 split)")
    print(sep())

    n_classes = len(np.unique(y))
    single_class = n_classes < 2

    if single_class:
        print("  ⚠  Only one class in labels — metrics will reflect trivial classifier.")
        print(f"  Class distribution: {dict(y.value_counts())}")

    try:
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42,
            stratify=y if not single_class else None
        )
    except ValueError:
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    print(f"  Train: {len(X_train)} | Test: {len(X_test)}")

    models = {
        "Logistic Regression": load_or_train_model("Logistic Regression", X_train, y_train),
        "Random Forest": load_or_train_model("Random Forest", X_train, y_train),
    }

    all_metrics = {}
    for name, model in models.items():
        print(f"\n  [{name}]")
        y_pred = model.predict(X_test)
        y_prob = model.predict_proba(X_test)[:, 1]

        n_test_classes = len(np.unique(y_test))
        metrics = {
            "roc_auc":   roc_auc_score(y_test, y_prob) if n_test_classes > 1 else float('nan'),
            "f1":        f1_score(y_test, y_pred, zero_division=0),
            "precision": precision_score(y_test, y_pred, zero_division=0),
            "recall":    recall_score(y_test, y_pred, zero_division=0),
            "accuracy":  accuracy_score(y_test, y_pred),
            "brier":     brier_score_loss(y_test, y_prob),
        }

        for k, v in metrics.items():
            direction = "(lower=better)" if k == "brier" else ""
            val_str   = f"{v:.4f}" if not (isinstance(v, float) and np.isnan(v)) else "N/A (single class)"
            print(f"    {k:12s}: {val_str}  {direction}")

        cm = confusion_matrix(y_test, y_pred, labels=[0, 1])
        print(f"    Confusion matrix:")
        print(f"      TN={cm[0,0]}  FP={cm[0,1]}")
        print(f"      FN={cm[1,0]}  TP={cm[1,1]}")

        all_metrics[name] = metrics

    return all_metrics


# ─────────────────────────────────────────
# Feature Importance
# ─────────────────────────────────────────

def evaluate_feature_importance(X, y):
    print(f"\n{sep()}")
    print("  FEATURE IMPORTANCE")
    print(sep())

    models = {
        "Logistic Regression": load_or_train_model("Logistic Regression", X, y),
        "Random Forest": load_or_train_model("Random Forest", X, y),
    }

    importance_data = {}
    for name, model in models.items():
        print(f"\n  [{name}]")
        if hasattr(model, 'feature_importances_'):
            importances = model.feature_importances_
        elif hasattr(model, 'coef_'):
            importances = np.abs(model.coef_[0])
        else:
            print("    N/A")
            continue

        ranked = sorted(zip(FEATURE_COLS, importances), key=lambda x: -x[1])
        importance_data[name] = ranked
        for rank, (feat, imp) in enumerate(ranked, 1):
            bar = "█" * max(1, int(imp * 40))
            print(f"    {rank:2d}. {feat:35s} {imp:.4f}  {bar}")

    return importance_data


# ─────────────────────────────────────────
# Report Writer
# ─────────────────────────────────────────

def save_report(cv_results, holdout_metrics, importance_data, dataset_info):
    os.makedirs(MODEL_DIR, exist_ok=True)
    lines = []
    lines.append(sep())
    lines.append("DATAQUEST AI - OFFLINE EVALUATION REPORT")
    lines.append(sep())
    lines.append(f"Generated  : {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    lines.append(f"Dataset    : {dataset_info['n_samples']} users, {dataset_info['n_features']} features")
    lines.append(f"Drop rate  : {dataset_info['drop_rate']:.1%}")
    lines.append("")

    if dataset_info['drop_rate'] > 0.9:
        lines.append("NOTE: Nearly all users are labelled drop_risk=1. This is because the")
        lines.append("training data was generated with timestamps in the past and the drop_risk")
        lines.append("label threshold (inactive > 10 days) now applies to virtually all users.")
        lines.append("Cross-validation is skipped; hold-out and feature importance are reported.")
        lines.append("")

    # Cross-validation
    lines.append(sep())
    if cv_results:
        lines.append("CROSS-VALIDATION")
        lines.append(sep())
        for model_name, stats in cv_results.items():
            lines.append(f"\n{model_name}:")
            for metric, scores in stats.items():
                lines.append(f"  {metric:12s}: {scores.mean():.4f} ± {scores.std():.4f}")
    else:
        lines.append("CROSS-VALIDATION: SKIPPED (single class or insufficient minority samples)")
        lines.append(sep())

    # Hold-out
    lines.append("")
    lines.append(sep())
    lines.append("HOLD-OUT TEST SET (80/20 split)")
    lines.append(sep())
    for model_name, metrics in holdout_metrics.items():
        lines.append(f"\n{model_name}:")
        for k, v in metrics.items():
            val_str = f"{v:.4f}" if not (isinstance(v, float) and np.isnan(v)) else "N/A"
            lines.append(f"  {k:12s}: {val_str}")

    # Feature importance
    lines.append("")
    lines.append(sep())
    lines.append("FEATURE IMPORTANCE")
    lines.append(sep())
    for model_name, ranked in importance_data.items():
        lines.append(f"\n{model_name}:")
        for rank, (feat, imp) in enumerate(ranked, 1):
            lines.append(f"  {rank:2d}. {feat:35s} {imp:.4f}")

    lines.append("")
    lines.append(sep())
    lines.append("END OF REPORT")
    lines.append(sep())

    with open(REPORT_PATH, 'w', encoding='utf-8') as f:
        f.write("\n".join(lines))

    print(f"\n  ✅ Report saved to {REPORT_PATH}")


# ─────────────────────────────────────────
# Main
# ─────────────────────────────────────────

def main():
    print(sep())
    print("  DATAQUEST AI — OFFLINE MODEL EVALUATION")
    print(sep())
    print(f"  Timestamp : {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"  Data      : {DATA_PATH}")
    print(sep())

    X, y, df = load_data(DATA_PATH)
    dataset_info = {
        'n_samples' : len(X),
        'n_features': len(FEATURE_COLS),
        'drop_rate' : float(y.mean()),
    }
    print(f"\n  Loaded {len(X)} users")
    print(f"  Drop rate : {y.mean():.1%}  (class dist: {dict(y.value_counts())})")

    if y.mean() > 0.9:
        print("""
  ⚠  WARNING: Near-perfect class imbalance detected.
     All training examples may have the same label because the dataset was
     generated with past timestamps and the drop_risk threshold (>10 days
     inactive) now applies to all users.
     Evaluation proceeds but CV may be skipped.
""")

    cv_results      = run_cross_validation(X, y)
    holdout_metrics = evaluate_on_holdout(X, y)
    importance_data = evaluate_feature_importance(X, y)

    save_report(cv_results, holdout_metrics, importance_data, dataset_info)

    print(f"\n{sep()}")
    print("  ✅ EVALUATION COMPLETE")
    print(sep())


if __name__ == "__main__":
    main()
