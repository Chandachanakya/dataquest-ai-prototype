"""Read distributions of all key columns to design correct thresholds."""
import pandas as pd

df = pd.read_csv('data/training_features.csv')
print(f"Users: {len(df)}\n")

cols = ['days_since_last_active', 'total_attempts', 'completion_rate',
        'retry_ratio', 'average_score', 'activity_frequency', 'score_variance', 'recent_xp_velocity']

for col in cols:
    s = df[col]
    pcts = [10, 25, 30, 40, 50, 60, 70, 75, 90]
    vals = [round(s.quantile(p/100), 2) for p in pcts]
    print(f"{col}:")
    print(f"  min={s.min():.2f}  max={s.max():.2f}  mean={s.mean():.2f}  std={s.std():.2f}")
    print(f"  pcts {pcts}")
    print(f"  vals {vals}")
    print()

print("persona_type distribution:")
print(df['persona_type'].value_counts().to_string())
