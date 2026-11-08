"""
Data Simulation Script
Generates realistic user behavior data for ML model training.

Creates diverse user personas with different learning patterns:
- Fast learners (high scores, quick completion)
- Struggling learners (low scores, many retries)
- Consistent learners (steady progress)
- Drop-risk learners (decreasing activity)
"""

import os
import random
from datetime import datetime, timedelta
from typing import List, Dict, Any
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing Supabase credentials in .env file")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Quest IDs from the system
QUEST_IDS = [
    "python-basics-1", "python-basics-2", "python-basics-3",
    "data-structures-1", "data-structures-2", "data-structures-3",
    "numpy-1", "numpy-2", "pandas-1", "pandas-2",
    "visualization-1", "visualization-2", "ml-basics-1", "ml-basics-2"
]

# Difficulty levels
DIFFICULTY_MAP = {
    "python-basics-1": 1, "python-basics-2": 1, "python-basics-3": 2,
    "data-structures-1": 2, "data-structures-2": 3, "data-structures-3": 3,
    "numpy-1": 3, "numpy-2": 4, "pandas-1": 4, "pandas-2": 5,
    "visualization-1": 4, "visualization-2": 5, "ml-basics-1": 5, "ml-basics-2": 6
}

# User personas
class UserPersona:
    def __init__(self, persona_type: str):
        self.type = persona_type
        
        if persona_type == "fast_learner":
            self.base_score = random.randint(85, 100)
            self.score_variance = 5
            self.completion_time_factor = 0.6  # Faster than average
            self.retry_rate = 0.1  # Rarely retries
            self.drop_probability = 0.05  # Very unlikely to drop
            self.activity_consistency = 0.9  # Very consistent
            
        elif persona_type == "struggling":
            self.base_score = random.randint(40, 65)
            self.score_variance = 15
            self.completion_time_factor = 1.5  # Slower than average
            self.retry_rate = 0.4  # Often retries
            self.drop_probability = 0.3  # Higher drop risk
            self.activity_consistency = 0.6  # Less consistent
            
        elif persona_type == "consistent":
            self.base_score = random.randint(70, 85)
            self.score_variance = 8
            self.completion_time_factor = 1.0  # Average speed
            self.retry_rate = 0.2  # Moderate retries
            self.drop_probability = 0.1  # Low drop risk
            self.activity_consistency = 0.85  # Very consistent
            
        elif persona_type == "drop_risk":
            self.base_score = random.randint(50, 75)
            self.score_variance = 20
            self.completion_time_factor = 1.3
            self.retry_rate = 0.35
            self.drop_probability = 0.6  # High drop risk
            self.activity_consistency = 0.4  # Inconsistent, gaps in activity

def generate_score(persona: UserPersona, difficulty: int, attempt_number: int) -> int:
    """Generate a score based on persona and difficulty."""
    base = persona.base_score
    
    # Adjust for difficulty
    difficulty_penalty = (difficulty - 3) * 5
    
    # Improve slightly with retries
    retry_bonus = min(attempt_number * 3, 15)
    
    # Add variance
    variance = random.randint(-persona.score_variance, persona.score_variance)
    
    score = base - difficulty_penalty + retry_bonus + variance
    return max(0, min(100, score))

def generate_completion_time(persona: UserPersona, difficulty: int) -> int:
    """Generate completion time in seconds."""
    base_time = 300 + (difficulty * 120)  # 5-17 minutes base
    adjusted_time = base_time * persona.completion_time_factor
    variance = random.randint(-60, 120)
    return max(60, int(adjusted_time + variance))

def should_retry(persona: UserPersona, score: int) -> bool:
    """Determine if user retries based on score and persona."""
    if score >= 80:
        return False
    retry_chance = persona.retry_rate * (100 - score) / 100
    return random.random() < retry_chance

def should_continue_activity(persona: UserPersona, days_since_start: int) -> bool:
    """Determine if user continues being active."""
    # Drop risk increases over time
    drop_chance = persona.drop_probability * (1 + days_since_start / 30)
    return random.random() > drop_chance

def generate_user_journey(user_id: str, persona: UserPersona, start_date: datetime, num_quests: int = 10) -> List[Dict[str, Any]]:
    """Generate a complete user journey with quest attempts."""
    attempts = []
    current_date = start_date
    quests_completed = 0
    
    for quest_idx in range(min(num_quests, len(QUEST_IDS))):
        quest_id = QUEST_IDS[quest_idx]
        difficulty = DIFFICULTY_MAP[quest_id]
        
        # Check if user is still active
        days_since_start = (current_date - start_date).days
        if not should_continue_activity(persona, days_since_start):
            print(f"  User {user_id[:8]} dropped out after {quests_completed} quests")
            break
        
        # Add some activity gaps for less consistent users
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
                "timestamp": current_date.isoformat()
            }
            
            attempts.append(attempt)
            
            if score >= 60:
                quest_completed = True
                quests_completed += 1
            elif should_retry(persona, score):
                attempt_number += 1
                current_date += timedelta(hours=random.randint(1, 24))
            else:
                # User gave up on this quest
                break
        
        # Move to next day for next quest
        current_date += timedelta(days=1)
    
    return attempts

def simulate_users(num_users: int = 50, seed: int = 42) -> List[Dict[str, Any]]:
    """Simulate multiple users with different personas."""
    random.seed(seed)
    all_attempts = []
    
    # Distribution of personas
    persona_distribution = {
        "fast_learner": 0.2,
        "struggling": 0.25,
        "consistent": 0.35,
        "drop_risk": 0.2
    }
    
    start_date = datetime.now() - timedelta(days=60)
    
    print(f"\n🎭 Simulating {num_users} users...")
    
    for i in range(num_users):
        # Select persona based on distribution
        rand = random.random()
        cumulative = 0
        persona_type = "consistent"
        
        for ptype, prob in persona_distribution.items():
            cumulative += prob
            if rand <= cumulative:
                persona_type = ptype
                break
        
        persona = UserPersona(persona_type)
        
        # Generate unique user ID
        user_id = f"sim_user_{i:03d}_{persona_type}"
        
        # Vary start dates
        user_start = start_date + timedelta(days=random.randint(0, 30))
        
        # Generate journey
        num_quests = random.randint(5, 14)
        attempts = generate_user_journey(user_id, persona, user_start, num_quests)
        
        all_attempts.extend(attempts)
        
        print(f"  ✓ User {i+1}/{num_users}: {persona_type} - {len(attempts)} attempts")
    
    return all_attempts

def insert_to_supabase(attempts: List[Dict[str, Any]]):
    """Insert simulated data into Supabase."""
    print(f"\n📤 Inserting {len(attempts)} attempts into Supabase...")
    
    # Insert in batches of 100
    batch_size = 100
    for i in range(0, len(attempts), batch_size):
        batch = attempts[i:i+batch_size]
        
        try:
            result = supabase.table("quest_attempts").insert(batch).execute()
            print(f"  ✓ Inserted batch {i//batch_size + 1} ({len(batch)} records)")
        except Exception as e:
            print(f"  ✗ Error inserting batch: {e}")
            # Continue with next batch
    
    print(f"\n✅ Data simulation complete!")

def main():
    """Main execution."""
    print("=" * 60)
    print("🎲 ML Training Data Simulation")
    print("=" * 60)
    
    # Generate data
    num_users = 150  # Increased to generate 500+ attempts
    attempts = simulate_users(num_users)
    
    print(f"\n📊 Generated {len(attempts)} quest attempts")
    
    # Show statistics
    persona_counts = {}
    for attempt in attempts:
        persona = attempt['user_id'].split('_')[2]
        persona_counts[persona] = persona_counts.get(persona, 0) + 1
    
    print("\n📈 Persona Distribution:")
    for persona, count in persona_counts.items():
        print(f"  {persona}: {count} attempts")
    
    # Insert to database
    confirm = input("\n⚠️  Insert data into Supabase? (yes/no): ")
    if confirm.lower() == 'yes':
        insert_to_supabase(attempts)
    else:
        print("\n❌ Cancelled. Data not inserted.")

if __name__ == "__main__":
    main()
