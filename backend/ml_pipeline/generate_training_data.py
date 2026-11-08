"""
Simplified Data Simulation - Direct to CSV
Generates training data and saves directly to CSV files (no Supabase required)
"""

import random
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Any

RANDOM_SEED = 42
GENERATION_TIMESTAMP = datetime(2026, 11, 8, 12, 0, 0)

# Quest IDs and difficulty
QUEST_IDS = [
    "python-basics-1", "python-basics-2", "python-basics-3",
    "data-structures-1", "data-structures-2", "data-structures-3",
    "numpy-1", "numpy-2", "pandas-1", "pandas-2",
    "visualization-1", "visualization-2", "ml-basics-1", "ml-basics-2"
]

DIFFICULTY_MAP = {
    "python-basics-1": 1, "python-basics-2": 1, "python-basics-3": 2,
    "data-structures-1": 2, "data-structures-2": 3, "data-structures-3": 3,
    "numpy-1": 3, "numpy-2": 4, "pandas-1": 4, "pandas-2": 5,
    "visualization-1": 4, "visualization-2": 5, "ml-basics-1": 5, "ml-basics-2": 6
}

class UserPersona:
    def __init__(self, persona_type: str):
        self.type = persona_type
        
        if persona_type == "fast_learner":
            self.base_score = random.randint(85, 100)
            self.score_variance = 5
            self.completion_time_factor = 0.6
            self.retry_rate = 0.1
            self.drop_probability = 0.05
            self.activity_consistency = 0.9
            
        elif persona_type == "struggling":
            self.base_score = random.randint(40, 65)
            self.score_variance = 15
            self.completion_time_factor = 1.5
            self.retry_rate = 0.4
            self.drop_probability = 0.3
            self.activity_consistency = 0.6
            
        elif persona_type == "consistent":
            self.base_score = random.randint(70, 85)
            self.score_variance = 8
            self.completion_time_factor = 1.0
            self.retry_rate = 0.2
            self.drop_probability = 0.1
            self.activity_consistency = 0.85
            
        elif persona_type == "drop_risk":
            self.base_score = random.randint(50, 75)
            self.score_variance = 20
            self.completion_time_factor = 1.3
            self.retry_rate = 0.35
            self.drop_probability = 0.6
            self.activity_consistency = 0.4

def generate_score(persona: UserPersona, difficulty: int, attempt_number: int) -> int:
    base = persona.base_score
    difficulty_penalty = (difficulty - 3) * 5
    retry_bonus = min(attempt_number * 3, 15)
    
    # Increase variance by injecting random uncharacteristic good/bad days
    base_variance = random.randint(-persona.score_variance, persona.score_variance)
    if random.random() < 0.15:  # 15% chance of a wild swing
        wild_swing = random.randint(-30, 30)
    else:
        wild_swing = 0
        
    score = base - difficulty_penalty + retry_bonus + base_variance + wild_swing
    return max(0, min(100, int(score)))

def generate_completion_time(persona: UserPersona, difficulty: int) -> int:
    base_time = 300 + (difficulty * 120)
    adjusted_time = base_time * persona.completion_time_factor
    
    # Much wider variance (distractions, leaving desk, etc.)
    if random.random() < 0.10: 
        variance = random.randint(300, 1800) # Left the tab open
    else:
        variance = random.randint(-120, 240)
        
    return max(60, int(adjusted_time + variance))

def should_retry(persona: UserPersona, score: int) -> bool:
    if score >= 80:
        return False
    retry_chance = persona.retry_rate * (100 - score) / 100
    return random.random() < retry_chance

def should_continue_activity(persona: UserPersona, days_since_start: int) -> bool:
    # 15% of the time, users act completely counter to their persona (Life gets in the way)
    if random.random() < 0.15:
        return random.random() > 0.5
        
    drop_chance = persona.drop_probability * (1 + days_since_start / 30)
    return random.random() > drop_chance

def generate_user_journey(user_id: str, persona: UserPersona, start_date: datetime, num_quests: int = 10) -> List[Dict[str, Any]]:
    attempts = []
    current_date = start_date
    quests_completed = 0
    
    for quest_idx in range(min(num_quests, len(QUEST_IDS))):
        quest_id = QUEST_IDS[quest_idx]
        difficulty = DIFFICULTY_MAP[quest_id]
        
        days_since_start = (current_date - start_date).days
        if not should_continue_activity(persona, days_since_start):
            break
        
        if random.random() > persona.activity_consistency:
            gap_days = random.randint(1, 5)
            current_date += timedelta(days=gap_days)
        
        attempt_number = 1
        quest_completed = False
        
        while not quest_completed and attempt_number <= 3:
            score = generate_score(persona, difficulty, attempt_number)
            completion_time = generate_completion_time(persona, difficulty)
            
            attempt = {
                "user_id": user_id,
                "quest_id": quest_id,
                "score": score,
                "completion_time": completion_time,
                "difficulty": difficulty,
                "attempt_number": attempt_number,
                "completed": score >= 60,
                "timestamp": current_date.isoformat(),
                "persona_type": persona.type
            }
            
            attempts.append(attempt)
            
            if score >= 60:
                quest_completed = True
                quests_completed += 1
            elif should_retry(persona, score):
                attempt_number += 1
                current_date += timedelta(hours=random.randint(1, 24))
            else:
                break
        
        current_date += timedelta(days=1)
    
    return attempts

def simulate_users(num_users: int = 1000, seed: int = RANDOM_SEED,
                   generation_timestamp: datetime = GENERATION_TIMESTAMP) -> pd.DataFrame:
    """Simulate users and return as DataFrame."""
    random.seed(seed)
    all_attempts = []
    
    persona_distribution = {
        "fast_learner": 0.2,
        "struggling": 0.25,
        "consistent": 0.35,
        "drop_risk": 0.2
    }
    
    start_date = generation_timestamp - timedelta(days=60)
    
    print(f"\n🎭 Simulating {num_users} users...")
    
    for i in range(num_users):
        rand = random.random()
        cumulative = 0
        persona_type = "consistent"
        
        for ptype, prob in persona_distribution.items():
            cumulative += prob
            if rand <= cumulative:
                persona_type = ptype
                break
        
        persona = UserPersona(persona_type)
        user_id = f"sim_user_{i:03d}_{persona_type}"
        user_start = start_date + timedelta(days=random.randint(0, 30))
        num_quests = random.randint(5, 14)
        attempts = generate_user_journey(user_id, persona, user_start, num_quests)
        all_attempts.extend(attempts)
        
        if (i + 1) % 10 == 0:
            print(f"  ✓ Generated {i+1}/{num_users} users...")
    
    df = pd.DataFrame(all_attempts)
    print(f"\n✅ Generated {len(df)} quest attempts")
    return df

def main():
    print("=" * 60)
    print("🎲 ML Training Data Simulation (Direct to CSV)")
    print("=" * 60)
    
    # Generate data
    df = simulate_users(num_users=1000)
    
    # Show statistics
    print("\n📈 Persona Distribution:")
    print(df['persona_type'].value_counts())
    
    print("\n📊 Statistics:")
    print(f"  Total attempts: {len(df)}")
    print(f"  Unique users: {df['user_id'].nunique()}")
    print(f"  Completion rate: {df['completed'].mean():.1%}")
    print(f"  Average score: {df['score'].mean():.1f}")
    
    # Save to CSV
    output_file = "data/quest_attempts.csv"
    df.to_csv(output_file, index=False)
    print(f"\n💾 Saved to: {output_file}")
    print("\n✅ Ready for training! Run: python train.py")

if __name__ == "__main__":
    main()
