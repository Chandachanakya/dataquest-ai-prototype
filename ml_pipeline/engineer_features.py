"""
Feature Engineering for ML Training (CSV-based)
Processes raw quest attempts and creates ML-ready features
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List

def load_data(filepath: str = "data/quest_attempts.csv") -> pd.DataFrame:
    """Load quest attempts data."""
    df = pd.read_csv(filepath)
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    return df

def calculate_user_features(df: pd.DataFrame) -> pd.DataFrame:
    """Calculate per-user features for ML training."""
    
    # Sort by user and timestamp
    df = df.sort_values(['user_id', 'timestamp'])
    
    features_list = []
    
    for user_id in df['user_id'].unique():
        user_data = df[df['user_id'] == user_id].copy()
        
        # Get latest timestamp for this user
        latest_timestamp = user_data['timestamp'].max()
        
        # Calculate features
        features = {
            'user_id': user_id,
            'persona_type': user_data['persona_type'].iloc[0],
            
            # Feature 1: Days since last active
            'days_since_last_active': (datetime.now() - latest_timestamp).days,
            
            # Feature 2: Activity frequency (active days in last 30 days)
            'activity_frequency': len(user_data[
                user_data['timestamp'] >= (latest_timestamp - timedelta(days=30))
            ]['timestamp'].dt.date.unique()),
            
            # Feature 3: Average score (normalized by difficulty)
            'average_score': (user_data['score'] / (user_data['difficulty'] * 10)).mean() * 100,
            
            # Feature 4: Total attempts
            'total_attempts': len(user_data),
            
            # Feature 5: Completion time vs median
            'completion_time_vs_median': user_data['completion_time'].mean() / user_data['completion_time'].median() if len(user_data) > 1 else 1.0,
            
            # Feature 6: Retry ratio (attempts per unique quest)
            'retry_ratio': len(user_data) / user_data['quest_id'].nunique(),
            
            # Feature 7: Score variance
            'score_variance': user_data['score'].std() if len(user_data) > 1 else 0,
            
            # Feature 8: Recent XP velocity (last 7 days)
            'recent_xp_velocity': user_data[
                user_data['timestamp'] >= (latest_timestamp - timedelta(days=7))
            ]['score'].sum() / 7,
            
            # Feature 9: Completion rate
            'completion_rate': user_data['completed'].mean(),
            
            # Feature 10: Average difficulty attempted
            'avg_difficulty': user_data['difficulty'].mean(),
            
            # Label: Drop risk (inactive > 10 days)
            'drop_risk': 1 if (datetime.now() - latest_timestamp).days > 10 else 0
        }
        
        features_list.append(features)
    
    return pd.DataFrame(features_list)

def create_training_dataset(raw_data_path: str = "data/quest_attempts.csv",
                           output_path: str = "data/training_features.csv") -> pd.DataFrame:
    """Create ML-ready training dataset with engineered features."""
    
    print("=" * 60)
    print("🔧 Feature Engineering Pipeline")
    print("=" * 60)
    
    # Load raw data
    print("\n📥 Loading raw data...")
    df = load_data(raw_data_path)
    print(f"  ✓ Loaded {len(df)} quest attempts from {df['user_id'].nunique()} users")
    
    # Calculate features
    print("\n⚙️  Calculating features...")
    features_df = calculate_user_features(df)
    print(f"  ✓ Generated {len(features_df.columns)} features for {len(features_df)} users")
    
    # Show feature statistics
    print("\n📊 Feature Statistics:")
    print(f"  Average score: {features_df['average_score'].mean():.1f}")
    print(f"  Average activity frequency: {features_df['activity_frequency'].mean():.1f} days/month")
    print(f"  Drop risk rate: {features_df['drop_risk'].mean():.1%}")
    print(f"  Completion rate: {features_df['completion_rate'].mean():.1%}")
    
    # Check label balance
    print("\n🎯 Label Distribution:")
    print(features_df['drop_risk'].value_counts())
    drop_rate = features_df['drop_risk'].mean()
    if drop_rate < 0.1 or drop_rate > 0.9:
        print("  ⚠️  WARNING: Imbalanced labels - may need SMOTE or class weights")
    else:
        print("  ✓ Labels are reasonably balanced")
    
    # Save to CSV
    features_df.to_csv(output_path, index=False)
    print(f"\n💾 Saved training features to: {output_path}")
    
    # Show sample
    print("\n📋 Sample Features:")
    print(features_df.head())
    
    print("\n✅ Feature engineering complete!")
    print(f"📈 Ready for model training with {len(features_df)} samples")
    
    return features_df

if __name__ == "__main__":
    create_training_dataset()
