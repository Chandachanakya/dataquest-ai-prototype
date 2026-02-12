# Data Simulation Guide

## Overview

The `simulate_data.py` script generates realistic user behavior data for training ML models. It creates diverse user personas with different learning patterns.

## User Personas

### 1. Fast Learner (20%)
- **Scores**: 85-100 (low variance)
- **Speed**: 40% faster than average
- **Retry Rate**: 10% (rarely retries)
- **Drop Risk**: 5% (very unlikely)
- **Consistency**: 90% (very active)

### 2. Struggling Learner (25%)
- **Scores**: 40-65 (high variance)
- **Speed**: 50% slower than average
- **Retry Rate**: 40% (often retries)
- **Drop Risk**: 30% (higher risk)
- **Consistency**: 60% (less active)

### 3. Consistent Learner (35%)
- **Scores**: 70-85 (moderate variance)
- **Speed**: Average
- **Retry Rate**: 20% (moderate)
- **Drop Risk**: 10% (low risk)
- **Consistency**: 85% (very active)

### 4. Drop-Risk Learner (20%)
- **Scores**: 50-75 (high variance)
- **Speed**: 30% slower
- **Retry Rate**: 35%
- **Drop Risk**: 60% (high risk)
- **Consistency**: 40% (inconsistent, gaps)

## Usage

### Basic Usage

```bash
cd ml_pipeline
python simulate_data.py
```

### What It Does

1. **Generates Users**: Creates 50 simulated users (configurable)
2. **Assigns Personas**: Distributes users across 4 persona types
3. **Simulates Journeys**: Each user attempts 5-14 quests
4. **Creates Attempts**: Generates quest attempts with:
   - Realistic scores based on difficulty and persona
   - Completion times with variance
   - Retry behavior
   - Activity gaps for drop-risk users

### Output

```
🎭 Simulating 50 users...
  ✓ User 1/50: fast_learner - 12 attempts
  ✓ User 2/50: consistent - 10 attempts
  ...
  
📊 Generated 523 quest attempts

📈 Persona Distribution:
  fast_learner: 105 attempts
  struggling: 131 attempts
  consistent: 183 attempts
  drop_risk: 104 attempts

⚠️  Insert data into Supabase? (yes/no):
```

## Configuration

Edit `simulate_data.py` to adjust:

```python
# Number of users
num_users = 50  # Change to 100 for more data

# Persona distribution
persona_distribution = {
    "fast_learner": 0.2,    # 20%
    "struggling": 0.25,     # 25%
    "consistent": 0.35,     # 35%
    "drop_risk": 0.2        # 20%
}

# Quest range per user
num_quests = random.randint(5, 14)  # 5-14 quests
```

## Data Schema

Each quest attempt includes:

```python
{
    "user_id": "sim_user_001_fast_learner",
    "quest_id": "python-basics-1",
    "score": 92,
    "completion_time": 245,  # seconds
    "difficulty": 1,
    "attempt_number": 1,
    "completed": true,
    "timestamp": "2026-01-15T10:30:00"
}
```

## After Simulation

Once data is inserted:

1. **Verify Data**:
   ```sql
   SELECT COUNT(*) FROM quest_attempts;
   -- Should show 500+ records
   ```

2. **Run Data Export**:
   ```bash
   python export_data.py
   ```

3. **Train Models**:
   ```bash
   python train.py
   ```

## Tips

- **Start Small**: Test with 10 users first
- **Check Distribution**: Ensure balanced persona mix
- **Verify Timestamps**: Should span 30-60 days
- **Monitor Inserts**: Watch for Supabase errors

## Troubleshooting

**Error: Missing Supabase credentials**
- Check `.env` file has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

**Error: Table doesn't exist**
- Run `manual_deployment.sql` first to create `quest_attempts` table

**Too few attempts**
- Increase `num_users` or adjust drop-out rates in personas
