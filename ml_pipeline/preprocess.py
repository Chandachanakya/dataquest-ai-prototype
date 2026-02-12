"""
Feature Engineering and Preprocessing for ML Pipeline
Transforms raw behavioral data into ML-ready features.

Features created:
- days_since_last_active: Days since last quest completion
- activity_frequency: Active days in last 30 days
- average_score: Mean score normalized by difficulty
- total_attempts: Total quest attempts
- completion_time_vs_median: Percentile of completion time
- retry_ratio: Attempts per unique quest
- score_variance: Consistency metric
- recent_xp_velocity: XP per day in last 7 days
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os

# Input/output directories
DATA_DIR = "ml_pipeline/data"
OUTPUT_DIR = "ml_pipeline/processed"
os.makedirs(OUTPUT_DIR, exist_ok=True)


def load_data():
    """Load exported CSV files."""
    print("Loading data...")
    
    quest_attempts = pd.read_csv(f"{DATA_DIR}/quest_attempts.csv", parse_dates=['started_at', 'completed_at', 'created_at'])
    decision_logs = pd.read_csv(f"{DATA_DIR}/decision_logs.csv", parse_dates=['timestamp', 'created_at'])
    action_logs = pd.read_csv(f"{DATA_DIR}/action_logs.csv", parse_dates=['executed_at'])
    learner_states = pd.read_csv(f"{DATA_DIR}/learner_states.csv", parse_dates=['computed_at', 'created_at'])
    user_progress = pd.read_csv(f"{DATA_DIR}/user_progress.csv", parse_dates=['completed_at', 'created_at'])
    
    print(f"✅ Loaded {len(quest_attempts)} quest attempts")
    print(f"✅ Loaded {len(decision_logs)} decision logs")
    print(f"✅ Loaded {len(action_logs)} action logs")
    print(f"✅ Loaded {len(learner_states)} learner states")
    print(f"✅ Loaded {len(user_progress)} user progress records")
    
    return quest_attempts, decision_logs, action_logs, learner_states, user_progress


def engineer_features(quest_attempts_df):
    """Create ML features from quest attempts."""
    print("\nEngineering features...")
    
    # Sort by user and time
    df = quest_attempts_df.sort_values(['user_id', 'started_at']).copy()
    
    # Feature 1: days_since_last_active
    df['days_since_last_active'] = df.groupby('user_id')['completed_at'].diff().dt.total_seconds() / 86400
    df['days_since_last_active'] = df['days_since_last_active'].fillna(0)
    
    # Feature 2: activity_frequency (active days in last 30 days)
    def calc_activity_frequency(group):
        group = group.sort_values('started_at')
        result = []
        for idx, row in group.iterrows():
            cutoff_date = row['started_at'] - timedelta(days=30)
            active_days = group[group['started_at'] >= cutoff_date]['started_at'].dt.date.nunique()
            result.append(active_days)
        return pd.Series(result, index=group.index)
    
    df['activity_frequency'] = df.groupby('user_id').apply(calc_activity_frequency).values
    
    # Feature 3: average_score
    df['average_score'] = df.groupby('user_id')['score'].transform(lambda x: x.expanding().mean())
    df['average_score'] = df['average_score'].fillna(0)
    
    # Feature 4: total_attempts
    df['total_attempts'] = df.groupby('user_id').cumcount() + 1
    
    # Feature 5: completion_time_vs_median
    median_time = df['completion_time'].median()
    df['completion_time_vs_median'] = df['completion_time'] / median_time
    df['completion_time_vs_median'] = df['completion_time_vs_median'].fillna(1.0)
    
    # Feature 6: retry_ratio
    df['unique_quests_attempted'] = df.groupby('user_id')['quest_id'].transform('nunique')
    df['retry_ratio'] = df['total_attempts'] / df['unique_quests_attempted']
    
    # Feature 7: score_variance
    df['score_variance'] = df.groupby('user_id')['score'].transform(lambda x: x.expanding().std())
    df['score_variance'] = df['score_variance'].fillna(0)
    
    # Feature 8: recent_xp_velocity (XP per day in last 7 days)
    def calc_xp_velocity(group):
        group = group.sort_values('started_at')
        result = []
        for idx, row in group.iterrows():
            cutoff_date = row['started_at'] - timedelta(days=7)
            recent_data = group[group['started_at'] >= cutoff_date]
            if len(recent_data) > 0:
                days_span = (recent_data['started_at'].max() - recent_data['started_at'].min()).total_seconds() / 86400
                days_span = max(days_span, 1)  # Avoid division by zero
                # Assuming XP is related to score (you may need to adjust this)
                total_xp = recent_data['score'].sum()
                xp_velocity = total_xp / days_span
            else:
                xp_velocity = 0
            result.append(xp_velocity)
        return pd.Series(result, index=group.index)
    
    df['recent_xp_velocity'] = df.groupby('user_id').apply(calc_xp_velocity).values
    
    print(f"✅ Created {len(df.columns)} features")
    
    return df


def create_labels(df):
    """Create target labels for ML models."""
    print("\nCreating labels...")
    
    # Label 1: Drop Risk (binary classification)
    # User is at drop risk if days_since_last_active > 10
    df['drop_risk_label'] = (df['days_since_last_active'] > 10).astype(int)
    
    # Label 2: Intervention Success (for future use)
    # This would require before/after comparison, placeholder for now
    df['intervention_success'] = 0  # Placeholder
    
    # Label 3: Sequencing Quality (for future use)
    # This would require learning velocity calculation, placeholder for now
    df['sequencing_quality'] = 0  # Placeholder
    
    print(f"✅ Drop risk distribution: {df['drop_risk_label'].value_counts().to_dict()}")
    
    # Check label balance
    drop_risk_ratio = df['drop_risk_label'].mean()
    if 0.1 < drop_risk_ratio < 0.9:
        print(f"✅ Labels are balanced ({drop_risk_ratio:.2%} positive)")
    else:
        print(f"⚠️  WARNING: Labels are imbalanced ({drop_risk_ratio:.2%} positive)")
    
    return df


def save_processed_data(df):
    """Save processed data for model training."""
    print("\nSaving processed data...")
    
    # Select features for ML
    feature_columns = [
        'user_id',
        'quest_id',
        'days_since_last_active',
        'activity_frequency',
        'average_score',
        'total_attempts',
        'completion_time_vs_median',
        'retry_ratio',
        'score_variance',
        'recent_xp_velocity',
        'drop_risk_label',
        'score',
        'completion_time',
        'status',
        'started_at',
        'completed_at'
    ]
    
    # Filter to only include rows with valid data
    df_clean = df[feature_columns].dropna(subset=['drop_risk_label'])
    
    # Save to CSV
    output_path = f"{OUTPUT_DIR}/features.csv"
    df_clean.to_csv(output_path, index=False)
    print(f"✅ Saved {len(df_clean)} samples to {output_path}")
    
    # Save feature summary
    summary_path = f"{OUTPUT_DIR}/feature_summary.txt"
    with open(summary_path, 'w') as f:
        f.write("FEATURE SUMMARY\n")
        f.write("="*60 + "\n\n")
        f.write(f"Total samples: {len(df_clean)}\n")
        f.write(f"Features: {len(feature_columns)}\n\n")
        f.write("Feature statistics:\n")
        f.write(df_clean.describe().to_string())
        f.write("\n\nFeature correlations with drop_risk_label:\n")
        numeric_cols = df_clean.select_dtypes(include=[np.number]).columns
        correlations = df_clean[numeric_cols].corr()['drop_risk_label'].sort_values(ascending=False)
        f.write(correlations.to_string())
    
    print(f"✅ Saved feature summary to {summary_path}")
    
    return df_clean


def main():
    """Main preprocessing function."""
    print("="*60)
    print("DATAQUEST AI - FEATURE ENGINEERING")
    print("="*60)
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*60 + "\n")
    
    # Load data
    quest_attempts, decision_logs, action_logs, learner_states, user_progress = load_data()
    
    # Engineer features
    df_features = engineer_features(quest_attempts)
    
    # Create labels
    df_labeled = create_labels(df_features)
    
    # Save processed data
    df_clean = save_processed_data(df_labeled)
    
    print("\n" + "="*60)
    print("✅ Feature engineering complete!")
    print("="*60)


if __name__ == "__main__":
    main()
