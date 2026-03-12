"""
Data Export Script for ML Pipeline
Extracts behavioral data from Supabase for ML model training.

Tables exported:
- quest_attempts: Quest completion data
- decision_logs: Learner state detection history
- action_logs: Intervention history
- learner_states: State transitions
- user_progress: Progress tracking
"""

import os
from datetime import datetime
from supabase import create_client, Client
import pandas as pd
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Supabase client
SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing Supabase credentials. Check .env file.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Output directory
OUTPUT_DIR = "ml_pipeline/data"
os.makedirs(OUTPUT_DIR, exist_ok=True)


def export_quest_attempts():
    """Export quest attempts data."""
    print("Exporting quest_attempts...")
    
    try:
        response = supabase.table("quest_attempts").select("*").execute()
        
        if not response.data or len(response.data) == 0:
            print("⚠️  WARNING: No quest_attempts data found!")
            # Create empty DataFrame with expected columns
            df = pd.DataFrame(columns=['id', 'user_id', 'quest_id', 'started_at', 'completed_at', 
                                      'score', 'completion_time', 'status', 'created_at'])
            return df
        
        df = pd.DataFrame(response.data)
        
        # Convert timestamps
        if 'started_at' in df.columns:
            df['started_at'] = pd.to_datetime(df['started_at'])
        if 'completed_at' in df.columns:
            df['completed_at'] = pd.to_datetime(df['completed_at'])
        if 'created_at' in df.columns:
            df['created_at'] = pd.to_datetime(df['created_at'])
        
        # Save to CSV
        output_path = f"{OUTPUT_DIR}/quest_attempts.csv"
        df.to_csv(output_path, index=False)
        print(f"✅ Exported {len(df)} quest attempts to {output_path}")
        
        return df
    except Exception as e:
        print(f"❌ ERROR exporting quest_attempts: {e}")
        df = pd.DataFrame(columns=['id', 'user_id', 'quest_id', 'started_at', 'completed_at', 
                                  'score', 'completion_time', 'status', 'created_at'])
        return df


def export_decision_logs():
    """Export decision logs data."""
    print("Exporting decision_logs...")
    
    try:
        response = supabase.table("decision_logs").select("*").execute()
        
        if not response.data or len(response.data) == 0:
            print("⚠️  WARNING: No decision_logs data found!")
            return pd.DataFrame()
        
        df = pd.DataFrame(response.data)
        
        # Convert timestamps
        if 'timestamp' in df.columns:
            df['timestamp'] = pd.to_datetime(df['timestamp'])
        if 'created_at' in df.columns:
            df['created_at'] = pd.to_datetime(df['created_at'])
        
        # Save to CSV
        output_path = f"{OUTPUT_DIR}/decision_logs.csv"
        df.to_csv(output_path, index=False)
        print(f"✅ Exported {len(df)} decision logs to {output_path}")
        
        return df
    except Exception as e:
        print(f"❌ ERROR exporting decision_logs: {e}")
        return pd.DataFrame()


def export_action_logs():
    """Export action logs data."""
    print("Exporting action_logs...")
    
    try:
        response = supabase.table("action_logs").select("*").execute()
        
        if not response.data or len(response.data) == 0:
            print("⚠️  WARNING: No action_logs data found!")
            return pd.DataFrame()
        
        df = pd.DataFrame(response.data)
        
        # Convert timestamps
        if 'executed_at' in df.columns:
            df['executed_at'] = pd.to_datetime(df['executed_at'])
        
        # Save to CSV
        output_path = f"{OUTPUT_DIR}/action_logs.csv"
        df.to_csv(output_path, index=False)
        print(f"✅ Exported {len(df)} action logs to {output_path}")
        
        return df
    except Exception as e:
        print(f"❌ ERROR exporting action_logs: {e}")
        return pd.DataFrame()


def export_learner_states():
    """Export learner states data."""
    print("Exporting learner_states...")
    
    response = supabase.table("learner_states").select("*").execute()
    df = pd.DataFrame(response.data)
    
    if df.empty:
        print("⚠️  WARNING: No learner_states data found!")
        return df
    
    # Convert timestamps
    df['computed_at'] = pd.to_datetime(df['computed_at'])
    df['created_at'] = pd.to_datetime(df['created_at'])
    
    # Save to CSV
    output_path = f"{OUTPUT_DIR}/learner_states.csv"
    df.to_csv(output_path, index=False)
    print(f"✅ Exported {len(df)} learner states to {output_path}")
    
    return df


def export_user_progress():
    """Export user progress data."""
    print("Exporting user_progress...")
    
    response = supabase.table("user_progress").select("*").execute()
    df = pd.DataFrame(response.data)
    
    if df.empty:
        print("⚠️  WARNING: No user_progress data found!")
        return df
    
    # Convert timestamps
    df['completed_at'] = pd.to_datetime(df['completed_at'])
    df['created_at'] = pd.to_datetime(df['created_at'])
    
    # Save to CSV
    output_path = f"{OUTPUT_DIR}/user_progress.csv"
    df.to_csv(output_path, index=False)
    print(f"✅ Exported {len(df)} user progress records to {output_path}")
    
    return df


def check_data_quality(quest_attempts_df, decision_logs_df):
    """Check if data meets minimum requirements for ML training."""
    print("\n" + "="*60)
    print("DATA QUALITY ASSESSMENT")
    print("="*60)
    
    # Requirement 1: Minimum 500 quest events
    quest_count = len(quest_attempts_df)
    print(f"\n1. Quest Events: {quest_count}")
    if quest_count >= 500:
        print("   ✅ PASS: Sufficient data (≥500 events)")
    else:
        print(f"   ❌ FAIL: Insufficient data (need {500 - quest_count} more events)")
    
    # Requirement 2: Check for null values in critical fields
    null_scores = quest_attempts_df['score'].isnull().sum()
    null_times = quest_attempts_df['completion_time'].isnull().sum()
    print(f"\n2. Data Completeness:")
    print(f"   - Null scores: {null_scores}/{quest_count}")
    print(f"   - Null completion times: {null_times}/{quest_count}")
    
    if null_scores < quest_count * 0.1 and null_times < quest_count * 0.1:
        print("   ✅ PASS: < 10% missing values")
    else:
        print("   ⚠️  WARNING: > 10% missing values")
    
    # Requirement 3: Check timestamp validity
    if not quest_attempts_df.empty:
        valid_timestamps = quest_attempts_df['started_at'].notna().sum()
        print(f"\n3. Timestamp Validity: {valid_timestamps}/{quest_count}")
        if valid_timestamps == quest_count:
            print("   ✅ PASS: All timestamps valid")
        else:
            print(f"   ❌ FAIL: {quest_count - valid_timestamps} invalid timestamps")
    
    # Requirement 4: Check drop-risk label balance
    if not quest_attempts_df.empty:
        # Calculate days since last active (simplified)
        quest_attempts_df_sorted = quest_attempts_df.sort_values('completed_at')
        
        print(f"\n4. Data Distribution:")
        print(f"   - Unique users: {quest_attempts_df['user_id'].nunique()}")
        print(f"   - Unique quests: {quest_attempts_df['quest_id'].nunique()}")
        print(f"   - Date range: {quest_attempts_df['started_at'].min()} to {quest_attempts_df['started_at'].max()}")
    
    # Decision logs check
    if not decision_logs_df.empty:
        print(f"\n5. Decision Logs:")
        print(f"   - Total decisions: {len(decision_logs_df)}")
        print(f"   - States detected: {decision_logs_df['state_detected'].value_counts().to_dict()}")
        print(f"   - Actions taken: {decision_logs_df['action_taken'].value_counts().to_dict()}")
    
    print("\n" + "="*60)
    
    # Overall assessment
    if quest_count >= 500:
        print("✅ READY FOR ML TRAINING")
    else:
        print("⚠️  INSUFFICIENT DATA - Consider using simulation data or collecting more")
    print("="*60 + "\n")


def main():
    """Main export function."""
    print("="*60)
    print("DATAQUEST AI - ML PIPELINE DATA EXPORT")
    print("="*60)
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Output directory: {OUTPUT_DIR}")
    print("="*60 + "\n")
    
    # Export all tables
    quest_attempts_df = export_quest_attempts()
    decision_logs_df = export_decision_logs()
    action_logs_df = export_action_logs()
    learner_states_df = export_learner_states()
    user_progress_df = export_user_progress()
    
    # Check data quality
    check_data_quality(quest_attempts_df, decision_logs_df)
    
    print("✅ Data export complete!")


if __name__ == "__main__":
    main()
