"""
Model Training Pipeline - Phase 2
Trains drop risk prediction models using engineered features from Phase 1
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    roc_auc_score, f1_score, precision_score, recall_score,
    classification_report, confusion_matrix
)
import joblib
import os
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

# Directories
DATA_DIR = "data"
MODEL_DIR = "models"
os.makedirs(MODEL_DIR, exist_ok=True)

def load_features(filepath: str = "data/training_features.csv") -> pd.DataFrame:
    """Load engineered features from Phase 1."""
    print("=" * 60)
    print("📥 Loading Features")
    print("=" * 60)
    df = pd.read_csv(filepath)
    print(f"  ✓ Loaded {len(df)} samples")
    print(f"  ✓ Features: {len(df.columns)} columns")
    return df

def prepare_data(df: pd.DataFrame):
    """Prepare features and labels for training."""
    print("\n⚙️  Preparing Data")
    print("=" * 60)
    
    # Feature columns (exclude metadata and label)
    feature_cols = [
        'days_since_last_active',
        'activity_frequency',
        'average_score',
        'total_attempts',
        'completion_time_vs_median',
        'retry_ratio',
        'score_variance',
        'recent_xp_velocity',
        'completion_rate',
        'avg_difficulty'
    ]
    
    X = df[feature_cols].copy()
    y = df['drop_risk'].copy()
    
    # Handle NaN values
    X = X.fillna(X.mean())
    
    print(f"  ✓ Features shape: {X.shape}")
    print(f"  ✓ Labels shape: {y.shape}")
    print(f"  ✓ Drop risk rate: {y.mean():.1%}")
    print(f"  ✓ Class balance: {(~y.astype(bool)).sum()} not at risk, {y.sum()} at risk")
    
    return X, y, feature_cols

def train_logistic_regression(X_train, y_train, X_test, y_test):
    """Train Logistic Regression baseline model."""
    print("\n🔵 Logistic Regression (Baseline)")
    print("=" * 60)
    
    model = LogisticRegression(random_state=42, max_iter=1000, class_weight='balanced')
    model.fit(X_train, y_train)
    
    # Predictions
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]
    
    # Metrics
    metrics = {
        'roc_auc': roc_auc_score(y_test, y_prob) if len(np.unique(y_test)) > 1 else 0.5,
        'f1': f1_score(y_test, y_pred, zero_division=0),
        'precision': precision_score(y_test, y_pred, zero_division=0),
        'recall': recall_score(y_test, y_pred, zero_division=0)
    }
    
    print(f"  ROC-AUC:   {metrics['roc_auc']:.4f}")
    print(f"  F1 Score:  {metrics['f1']:.4f}")
    print(f"  Precision: {metrics['precision']:.4f}")
    print(f"  Recall:    {metrics['recall']:.4f}")
    
    # Save model
    model_path = f"{MODEL_DIR}/drop_risk_lr_v1.pkl"
    joblib.dump(model, model_path)
    print(f"  ✓ Saved to {model_path}")
    
    return model, metrics

def train_random_forest(X_train, y_train, X_test, y_test):
    """Train Random Forest model."""
    print("\n🌲 Random Forest")
    print("=" * 60)
    
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        min_samples_split=5,
        min_samples_leaf=2,
        class_weight='balanced',
        random_state=42,
        n_jobs=-1
    )
    model.fit(X_train, y_train)
    
    # Predictions
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]
    
    # Metrics
    metrics = {
        'roc_auc': roc_auc_score(y_test, y_prob) if len(np.unique(y_test)) > 1 else 0.5,
        'f1': f1_score(y_test, y_pred, zero_division=0),
        'precision': precision_score(y_test, y_pred, zero_division=0),
        'recall': recall_score(y_test, y_pred, zero_division=0)
    }
    
    print(f"  ROC-AUC:   {metrics['roc_auc']:.4f}")
    print(f"  F1 Score:  {metrics['f1']:.4f}")
    print(f"  Precision: {metrics['precision']:.4f}")
    print(f"  Recall:    {metrics['recall']:.4f}")
    
    # Save model
    model_path = f"{MODEL_DIR}/drop_risk_rf_v1.pkl"
    joblib.dump(model, model_path)
    print(f"  ✓ Saved to {model_path}")
    
    return model, metrics

def cross_validate_models(X, y):
    """Perform 3-fold cross-validation (adjusted for small dataset)."""
    print("\n📊 3-Fold Cross-Validation")
    print("=" * 60)
    
    # Use 3-fold for small datasets
    n_splits = min(3, len(y) // 10)  # At least 10 samples per fold
    if n_splits < 2:
        print("  ⚠️  Dataset too small for cross-validation, skipping...")
        return {}
    
    cv = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=42)
    
    models = {
        'Logistic Regression': LogisticRegression(random_state=42, max_iter=1000, class_weight='balanced'),
        'Random Forest': RandomForestClassifier(n_estimators=100, max_depth=10, class_weight='balanced', random_state=42, n_jobs=-1)
    }
    
    results = {}
    for name, model in models.items():
        try:
            scores = cross_val_score(model, X, y, cv=cv, scoring='roc_auc', n_jobs=-1)
            results[name] = scores
            print(f"  {name:20s}: {scores.mean():.4f} ± {scores.std():.4f}")
        except Exception as e:
            print(f"  {name:20s}: Skipped - {str(e)[:50]}")
    
    return results

def analyze_feature_importance(model, feature_cols, model_name):
    """Analyze and display feature importance."""
    print(f"\n🔍 Feature Importance - {model_name}")
    print("=" * 60)
    
    if hasattr(model, 'feature_importances_'):
        importances = model.feature_importances_
    elif hasattr(model, 'coef_'):
        importances = np.abs(model.coef_[0])
    else:
        print("  Model doesn't support feature importance")
        return
    
    # Create importance dataframe
    importance_df = pd.DataFrame({
        'feature': feature_cols,
        'importance': importances
    }).sort_values('importance', ascending=False)
    
    print(importance_df.to_string(index=False))
    
    # Save to file
    importance_path = f"{MODEL_DIR}/feature_importance_{model_name.lower().replace(' ', '_')}.csv"
    importance_df.to_csv(importance_path, index=False)
    print(f"  ✓ Saved to {importance_path}")

def save_training_summary(results_dict, cv_results):
    """Save comprehensive training summary."""
    summary_path = f"{MODEL_DIR}/training_summary.txt"
    
    with open(summary_path, 'w') as f:
        f.write("=" * 60 + "\n")
        f.write("PHASE 2: MODEL TRAINING SUMMARY\n")
        f.write("=" * 60 + "\n")
        f.write(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write("=" * 60 + "\n\n")
        
        f.write("TEST SET PERFORMANCE:\n")
        f.write("-" * 60 + "\n")
        for model_name, metrics in results_dict.items():
            f.write(f"\n{model_name}:\n")
            for metric_name, value in metrics.items():
                f.write(f"  {metric_name:12s}: {value:.4f}\n")
        
        f.write("\n\nCROSS-VALIDATION RESULTS:\n")
        f.write("-" * 60 + "\n")
        for model_name, scores in cv_results.items():
            f.write(f"{model_name}: {scores.mean():.4f} ± {scores.std():.4f}\n")
        
        f.write("\n\nMODELS SAVED:\n")
        f.write("-" * 60 + "\n")
        f.write(f"  - {MODEL_DIR}/drop_risk_lr_v1.pkl\n")
        f.write(f"  - {MODEL_DIR}/drop_risk_rf_v1.pkl\n")
    
    print(f"\n💾 Training summary saved to {summary_path}")

def main():
    """Main training pipeline."""
    print("\n")
    print("=" * 60)
    print("🎯 PHASE 2: MODEL TRAINING")
    print("=" * 60)
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    # Load features
    df = load_features()
    X, y, feature_cols = prepare_data(df)
    
    # Check if we have enough samples
    if len(X) < 20:
        print("\n⚠️  WARNING: Very small dataset. Results may not be reliable.")
    
    # Train/test split (no stratification for very small datasets)
    print("\n📂 Train/Test Split")
    print("=" * 60)
    
    try:
        # Try stratified split first
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
    except ValueError:
        # Fall back to non-stratified if classes are too imbalanced
        print("  ⚠️  Using non-stratified split (class imbalance)")
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
    
    print(f"  Train set: {len(X_train)} samples ({len(X_train)/len(X)*100:.1f}%)")
    print(f"  Test set:  {len(X_test)} samples ({len(X_test)/len(X)*100:.1f}%)")
    
    # Train models
    lr_model, lr_metrics = train_logistic_regression(X_train, y_train, X_test, y_test)
    rf_model, rf_metrics = train_random_forest(X_train, y_train, X_test, y_test)
    
    # Cross-validation (skip if dataset too small)
    cv_results = {}
    if len(X) >= 30:
        cv_results = cross_validate_models(X, y)
    else:
        print("\n📊 Cross-Validation")
        print("=" * 60)
        print("  ⚠️  Dataset too small for reliable CV, skipping...")
    
    # Feature importance
    analyze_feature_importance(rf_model, feature_cols, "Random Forest")
    analyze_feature_importance(lr_model, feature_cols, "Logistic Regression")
    
    # Save summary
    results_dict = {
        'Logistic Regression': lr_metrics,
        'Random Forest': rf_metrics
    }
    save_training_summary(results_dict, cv_results)
    
    print("\n")
    print("=" * 60)
    print("✅ PHASE 2 COMPLETE!")
    print("=" * 60)
    print(f"Models saved to: {MODEL_DIR}/")
    print("Next step: Update ML API to use trained models")
    print("=" * 60)
    print("\n")

if __name__ == "__main__":
    main()
