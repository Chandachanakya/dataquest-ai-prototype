# Authoritative ten-feature specification

Training evaluates learners at one explicit snapshot timestamp (the raw extract's maximum timestamp by default); production evaluates at request time. All features use lifetime valid-timestamp attempts unless a rolling window is named. Future-dated and invalid-timestamp attempts are excluded. Invalid numeric source values become zero, except difficulty defaults to 1; absent completed duration uses the completion-time baseline.

| Feature | Formula and source | Window/reference | Default and domain |
|---|---|---|---|
| `days_since_last_active` | `(reference - max(started_at))/86400` | lifetime; reference timestamp | 30 if no attempts; >=0 |
| `activity_frequency` | distinct UTC attempt dates | `[reference-30d, reference]` | 0; integer 0..30 |
| `average_score` | mean of `100*score/(10*difficulty)` | lifetime | 0; >=0 (API max 1000) |
| `total_attempts` | count attempts | lifetime | 0; integer >=0 |
| `completion_time_vs_median` | mean positive time of completed attempts / 599 | lifetime completed numerator; all raw durations baseline | 1 if none; >0 |
| `retry_ratio` | attempts / distinct quest IDs | lifetime | 1 if none; >=1 |
| `score_variance` | sample score standard deviation (`ddof=1`) | lifetime | 0 if <2; >=0 |
| `recent_xp_velocity` | sum score / 7 | `[reference-7d, reference]` | 0; >=0 |
| `completion_rate` | completed attempts / attempts | lifetime | 0 if none; [0,1] |
| `avg_difficulty` | mean numeric difficulty | lifetime | 1 if none; [1,6] |

Difficulty is one 1--6 ordinal scale. Production labels map `beginner=1`, `intermediate=2`, `advanced=4`, and `expert=6`; 3 and 5 remain valid source values. This replaces the prior production 1--4 mapping, so model artifacts must be retrained before relying on corrected predictions.

The committed raw dataset has 3,203 rows and its all-attempt `completion_time` median is 599 seconds. The completed-only median is 584 seconds; it is deliberately not the baseline.
