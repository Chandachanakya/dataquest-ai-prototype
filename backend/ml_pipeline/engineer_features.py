"""
Feature Engineering for ML Training (CSV-based)
Processes raw quest attempts and creates ML-ready features.

LABEL LOGIC (v3 — Ground-Truth Anchored):
  Since the data is simulated, we have ground-truth persona types.
  We use those as the primary signal, then add behavioral overrides.

  drop_risk = 1 if:
    PRIMARY:   persona_type in ('drop_risk', 'struggling')  [~30% of dataset]
    OVERRIDE+: OR completion_rate < 0.35  (completed < 35% of attempts)
    OVERRIDE+: OR (retry_ratio > 2.8 AND average_score < 50)  (stuck hard)
    OVERRIDE-: AND NOT (fast_learner with avg_score > 75)  (protect clear successes)

  This yields a ~35-45% positive rate with strong behavioral validity:
  - Models learn REAL behavioral differences between groups
  - Persona ground-truth guarantees class separation exists in the features
  - Overrides catch edge-case struggling users who might be mislabeled
"""

import pandas as pd
import numpy as np
from datetime import timedelta


def load_data(filepath: str = "data/quest_attempts.csv") -> pd.DataFrame:
    df = pd.read_csv(filepath)
    df['timestamp'] = pd.to_datetime(df['timestamp'], errors='coerce', utc=True)
    return df


def calculate_user_features(df: pd.DataFrame, reference_time=None,
                            dataset_median_time=None, user_ids=None) -> pd.DataFrame:
    """Create lifetime features at an explicit snapshot timestamp.

    Invalid and future timestamps are excluded. Optional arguments make the
    production training implementation directly testable against fixtures.
    """
    df = df.copy()
    df['timestamp'] = pd.to_datetime(df['timestamp'], errors='coerce', utc=True)
    dataset_end = pd.Timestamp(reference_time) if reference_time is not None else df['timestamp'].max()
    if dataset_end.tzinfo is None:
        dataset_end = dataset_end.tz_localize('UTC')
    df = df[df['timestamp'].notna() & (df['timestamp'] <= dataset_end)].sort_values(['user_id', 'timestamp'])
    dataset_median_time = (float(dataset_median_time) if dataset_median_time is not None
                           else df.loc[df['completion_time'] > 0, 'completion_time'].median())
    known_users = list(user_ids) if user_ids is not None else list(df['user_id'].unique())

    features_list = []

    for user_id in known_users:
        ud = df[df['user_id'] == user_id].copy()
        if ud.empty:
            features_list.append({
                'user_id': user_id, 'persona_type': 'unknown',
                'days_since_last_active': 30.0, 'activity_frequency': 0,
                'average_score': 0.0, 'total_attempts': 0,
                'completion_time_vs_median': 1.0, 'retry_ratio': 1.0,
                'score_variance': 0.0, 'recent_xp_velocity': 0.0,
                'completion_rate': 0.0, 'avg_difficulty': 1.0,
            })
            continue
        latest_ts    = ud['timestamp'].max()
        total_att    = len(ud)
        unique_quests = ud['quest_id'].nunique()

        # 1. days_since_last_active (relative to dataset end — no datetime.now())
        days_since_last_active = (dataset_end - latest_ts).total_seconds() / 86400

        # 2. activity_frequency
        window_start = dataset_end - timedelta(days=30)
        activity_frequency = ud[ud['timestamp'] >= window_start]['timestamp'].dt.date.nunique()

        # 3. average_score (difficulty-normalized)
        avg_score = (ud['score'] / (ud['difficulty'] * 10)).mean() * 100

        # 4. total_attempts
        total_attempts = total_att

        # 5. completion_time_vs_median
        completed_mask = ud['completed'].isin([True, 'True', 1, '1'])
        completed_times = ud.loc[completed_mask & (ud['completion_time'] > 0), 'completion_time']
        completion_time_vs_median = (completed_times.mean() / dataset_median_time
                                     if len(completed_times) and dataset_median_time > 0 else 1.0)

        # 6. retry_ratio
        retry_ratio = total_att / unique_quests if unique_quests > 0 else 1.0

        # 7. score_variance
        score_variance = ud['score'].std() if total_att > 1 else 0.0

        # 8. recent_xp_velocity
        recent_window      = dataset_end - timedelta(days=7)
        recent_data        = ud[ud['timestamp'] >= recent_window]
        recent_xp_velocity = recent_data['score'].sum() / 7.0

        # 9. completion_rate
        completed_count = ud['completed'].sum()
        completion_rate = completed_count / total_att if total_att > 0 else 0.0

        # 10. avg_difficulty
        avg_difficulty = ud['difficulty'].mean()

        persona = ud['persona_type'].iloc[0]

        features_list.append({
            'user_id':                  user_id,
            'persona_type':             persona,
            'days_since_last_active':   round(days_since_last_active, 2),
            'activity_frequency':       activity_frequency,
            'average_score':            round(avg_score, 2),
            'total_attempts':           total_attempts,
            'completion_time_vs_median': round(completion_time_vs_median, 4),
            'retry_ratio':              round(retry_ratio, 4),
            'score_variance':           round(score_variance, 2),
            'recent_xp_velocity':       round(recent_xp_velocity, 4),
            'completion_rate':          round(completion_rate, 4),
            'avg_difficulty':           round(avg_difficulty, 2),
        })

    features_df = pd.DataFrame(features_list)

    # ── Label assignment ────────────────────────────────────────────────────
    #
    # Primary: persona-based ground truth
    at_risk_personas = features_df['persona_type'].isin(['drop_risk', 'struggling'])

    # Behavioral override+ (catch edge cases)
    override_plus = (
        (features_df['completion_rate'] < 0.35) |
        (
            (features_df['retry_ratio'] > 2.8) &
            (features_df['average_score'] < 50)
        )
    )

    # Behavioral override- (protect clear high-performers)
    override_minus = (
        (features_df['persona_type'] == 'fast_learner') &
        (features_df['average_score'] > 75) &
        (features_df['completion_rate'] > 0.70)
    )

    features_df['drop_risk'] = (
        ((at_risk_personas | override_plus) & ~override_minus)
    ).astype(int)

    return features_df


def create_training_dataset(raw_data_path: str = "data/quest_attempts.csv",
                            output_path:   str = "data/training_features.csv") -> pd.DataFrame:

    print("=" * 64)
    print("🔧 Feature Engineering — Ground-Truth Anchored Labels v3")
    print("=" * 64)

    print("\n📥 Loading raw data...")
    df = load_data(raw_data_path)
    print(f"  ✓ {len(df)} attempts from {df['user_id'].nunique()} users")

    print("\n⚙️  Calculating features...")
    features_df = calculate_user_features(df)

    # ── Label balance ───────────────────────────────────────────────────────
    n_pos     = features_df['drop_risk'].sum()
    n_neg     = len(features_df) - n_pos
    drop_rate = n_pos / len(features_df)

    print(f"\n🎯 Label Distribution:")
    print(f"  drop_risk=1 : {n_pos:>4}  ({drop_rate:.1%})")
    print(f"  drop_risk=0 : {n_neg:>4}  ({1-drop_rate:.1%})")
    if 0.30 <= drop_rate <= 0.70:
        print("  ✅ Balance GOOD (30–70%)")
    elif 0.20 <= drop_rate <= 0.80:
        print("  ⚠️  Balance ACCEPTABLE (20–80%)")
    else:
        print("  ❌ Balance POOR")

    print(f"\n📊 Persona × Label crosstab:")
    ct = pd.crosstab(features_df['persona_type'], features_df['drop_risk'],
                     margins=True, margins_name='Total')
    ct.columns = ['safe (0)', 'drop_risk (1)', 'Total']
    print(ct.to_string())

    print(f"\n📈 Key Feature Means by Label:")
    cols = ['average_score', 'completion_rate', 'retry_ratio',
            'activity_frequency', 'days_since_last_active']
    print(features_df.groupby('drop_risk')[cols].mean().round(2).to_string())

    # ── Save ────────────────────────────────────────────────────────────────
    features_df.to_csv(output_path, index=False)
    print(f"\n💾 Saved: {output_path}  ({len(features_df)} users × 10 features)")
    print("✅ Feature engineering complete!")
    return features_df


if __name__ == "__main__":
    create_training_dataset()
