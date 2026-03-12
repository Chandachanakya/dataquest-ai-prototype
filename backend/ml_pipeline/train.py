"""
Model Training Script for ML Pipeline
Trains and compares multiple ML models for drop risk prediction.

Models trained:
- Logistic Regression (baseline)
- Random Forest
- Gradient Boosting (XGBoost)

Evaluation:
- 5-fold cross-validation
- ROC-AUC, F1 Score, Precision, Recall
- Feature importance analysis
- Calibration curves
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.metrics import (
    roc_auc_score, f1_score, precision_score, recall_score,
    classification_report, confusion_matrix, roc_curve
)
from sklearn.calibration import calibration_curve
import matplotlib.pyplot as plt
import seaborn as sns
import joblib
import os
from datetime import datetime

# Directories
DATA_DIR = "ml_pipeline/processed"
MODEL_DIR = "ml_pipeline/models"
RESULTS_DIR = "ml_pipeline/results"

os.makedirs(MODEL_DIR, exist_ok=True)
os.makedirs(RESULTS_DIR, exist_ok=True)


def load_features():
    """Load preprocessed features."""
    print("Loading features...")
    df = pd.read_csv(f"{DATA_DIR}/features.csv", parse_dates=['started_at', 'completed_at'])
    print(f"✅ Loaded {len(df)} samples with {len(df.columns)} features")
    return df


def prepare_data(df):
    """Prepare data for training."""
    print("\nPreparing data...")
    
    # Select feature columns (exclude IDs, timestamps, and labels)
    feature_cols = [
        'days_since_last_active',
        'activity_frequency',
        'average_score',
        'total_attempts',
        'completion_time_vs_median',
        'retry_ratio',
        'score_variance',
        'recent_xp_velocity'
    ]
    
    X = df[feature_cols].copy()
    y = df['drop_risk_label'].copy()
    
    # Handle any remaining NaN values
    X = X.fillna(X.mean())
    
    print(f"✅ Features shape: {X.shape}")
    print(f"✅ Labels shape: {y.shape}")
    print(f"✅ Positive class ratio: {y.mean():.2%}")
    
    return X, y, feature_cols


def train_logistic_regression(X_train, y_train, X_test, y_test):
    """Train Logistic Regression baseline."""
    print("\n" + "="*60)
    print("LOGISTIC REGRESSION (Baseline)")
    print("="*60)
    
    model = LogisticRegression(random_state=42, max_iter=1000)
    model.fit(X_train, y_train)
    
    # Predictions
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]
    
    # Metrics
    roc_auc = roc_auc_score(y_test, y_prob)
    f1 = f1_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred)
    recall = recall_score(y_test, y_pred)
    
    print(f"ROC-AUC: {roc_auc:.4f}")
    print(f"F1 Score: {f1:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall: {recall:.4f}")
    
    # Save model
    joblib.dump(model, f"{MODEL_DIR}/logistic_regression_v1.pkl")
    print(f"✅ Model saved to {MODEL_DIR}/logistic_regression_v1.pkl")
    
    return model, {'roc_auc': roc_auc, 'f1': f1, 'precision': precision, 'recall': recall}


def train_random_forest(X_train, y_train, X_test, y_test):
    """Train Random Forest."""
    print("\n" + "="*60)
    print("RANDOM FOREST")
    print("="*60)
    
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        min_samples_split=20,
        random_state=42,
        n_jobs=-1
    )
    model.fit(X_train, y_train)
    
    # Predictions
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]
    
    # Metrics
    roc_auc = roc_auc_score(y_test, y_prob)
    f1 = f1_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred)
    recall = recall_score(y_test, y_pred)
    
    print(f"ROC-AUC: {roc_auc:.4f}")
    print(f"F1 Score: {f1:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall: {recall:.4f}")
    
    # Save model
    joblib.dump(model, f"{MODEL_DIR}/random_forest_v1.pkl")
    print(f"✅ Model saved to {MODEL_DIR}/random_forest_v1.pkl")
    
    return model, {'roc_auc': roc_auc, 'f1': f1, 'precision': precision, 'recall': recall}


def train_xgboost(X_train, y_train, X_test, y_test):
    """Train XGBoost."""
    print("\n" + "="*60)
    print("XGBOOST")
    print("="*60)
    
    model = XGBClassifier(
        n_estimators=100,
        max_depth=6,
        learning_rate=0.1,
        random_state=42,
        eval_metric='logloss'
    )
    model.fit(X_train, y_train)
    
    # Predictions
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]
    
    # Metrics
    roc_auc = roc_auc_score(y_test, y_prob)
    f1 = f1_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred)
    recall = recall_score(y_test, y_pred)
    
    print(f"ROC-AUC: {roc_auc:.4f}")
    print(f"F1 Score: {f1:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall: {recall:.4f}")
    
    # Save model
    joblib.dump(model, f"{MODEL_DIR}/xgboost_v1.pkl")
    print(f"✅ Model saved to {MODEL_DIR}/xgboost_v1.pkl")
    
    return model, {'roc_auc': roc_auc, 'f1': f1, 'precision': precision, 'recall': recall}


def cross_validate_models(X, y, feature_cols):
    """Perform 5-fold cross-validation."""
    print("\n" + "="*60)
    print("5-FOLD CROSS-VALIDATION")
    print("="*60)
    
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    
    models = {
        'Logistic Regression': LogisticRegression(random_state=42, max_iter=1000),
        'Random Forest': RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42, n_jobs=-1),
        'XGBoost': XGBClassifier(n_estimators=100, max_depth=6, random_state=42, eval_metric='logloss')
    }
    
    results = {}
    for name, model in models.items():
        scores = cross_val_score(model, X, y, cv=cv, scoring='roc_auc', n_jobs=-1)
        results[name] = scores
        print(f"{name}: {scores.mean():.4f} ± {scores.std():.4f}")
    
    return results


def plot_feature_importance(model, feature_cols, model_name):
    """Plot feature importance."""
    if hasattr(model, 'feature_importances_'):
        importances = model.feature_importances_
    elif hasattr(model, 'coef_'):
        importances = np.abs(model.coef_[0])
    else:
        return
    
    # Create DataFrame
    importance_df = pd.DataFrame({
        'feature': feature_cols,
        'importance': importances
    }).sort_values('importance', ascending=False)
    
    # Plot
    plt.figure(figsize=(10, 6))
    sns.barplot(data=importance_df, x='importance', y='feature')
    plt.title(f'Feature Importance - {model_name}')
    plt.xlabel('Importance')
    plt.tight_layout()
    plt.savefig(f"{RESULTS_DIR}/feature_importance_{model_name.lower().replace(' ', '_')}.png", dpi=150)
    plt.close()
    
    print(f"✅ Feature importance plot saved")


def save_results_summary(results_dict):
    """Save training results summary."""
    summary_path = f"{RESULTS_DIR}/training_summary.txt"
    
    with open(summary_path, 'w') as f:
        f.write("ML TRAINING RESULTS SUMMARY\n")
        f.write("="*60 + "\n")
        f.write(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write("="*60 + "\n\n")
        
        for model_name, metrics in results_dict.items():
            f.write(f"{model_name}:\n")
            for metric_name, value in metrics.items():
                f.write(f"  {metric_name}: {value:.4f}\n")
            f.write("\n")
    
    print(f"✅ Results summary saved to {summary_path}")


def main():
    """Main training function."""
    print("="*60)
    print("DATAQUEST AI - MODEL TRAINING")
    print("="*60)
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*60 + "\n")
    
    # Load data
    df = load_features()
    X, y, feature_cols = prepare_data(df)
    
    # Train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"\n✅ Train set: {len(X_train)} samples")
    print(f"✅ Test set: {len(X_test)} samples")
    
    # Train models
    lr_model, lr_metrics = train_logistic_regression(X_train, y_train, X_test, y_test)
    rf_model, rf_metrics = train_random_forest(X_train, y_train, X_test, y_test)
    xgb_model, xgb_metrics = train_xgboost(X_train, y_train, X_test, y_test)
    
    # Cross-validation
    cv_results = cross_validate_models(X, y, feature_cols)
    
    # Feature importance
    plot_feature_importance(rf_model, feature_cols, "Random Forest")
    plot_feature_importance(xgb_model, feature_cols, "XGBoost")
    
    # Save results
    results_dict = {
        'Logistic Regression': lr_metrics,
        'Random Forest': rf_metrics,
        'XGBoost': xgb_metrics
    }
    save_results_summary(results_dict)
    
    print("\n" + "="*60)
    print("✅ Model training complete!")
    print("="*60)


if __name__ == "__main__":
    main()
