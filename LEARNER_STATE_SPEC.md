# Phase 2: Learner State → Action Mapping Specification

## 1. Learner State Definitions (Deterministic Rules)

### STATE: DROP_RISK
**Priority:** 1 (Highest - overrides all other states)

**Entry Conditions:**
```
(last_active_at < NOW() - INTERVAL '14 days')
OR
(activity_frequency < 2 AND last_active_at IS NOT NULL)
```

**Numeric Thresholds:**
- `last_active_at`: > 14 days ago
- `activity_frequency`: < 2 active days in last 30 days

**Reasoning:**
User shows clear signs of disengagement. Immediate intervention required to prevent complete dropout. This state takes precedence over all others because retention is critical.

**Exit Condition:**
User completes any quest within 7 days of intervention.

---

### STATE: STRUGGLING
**Priority:** 2

**Entry Conditions:**
```
(average_score < 65.0)
AND
(total_attempts >= 10)
AND
(NOT in DROP_RISK state)
```

**Numeric Thresholds:**
- `average_score`: < 65.0 (out of 100)
- `total_attempts`: >= 10 attempts in last 30 days
- `improvement_rate`: < 5% (if available)

**Reasoning:**
User is actively engaged but consistently underperforming despite multiple attempts. Requires foundational support and reduced difficulty to build confidence.

**Exit Condition:**
Average score rises above 70 for 3 consecutive quests.

---

### STATE: FAST_LEARNER
**Priority:** 3

**Entry Conditions:**
```
(average_score > 90.0)
AND
(weekly_xp_earned > 500)
AND
(average_completion_time < system_median * 0.7)
```

**Numeric Thresholds:**
- `average_score`: > 90.0
- `weekly_xp_earned`: > 500 XP in last 7 days
- `completion_time`: < 70% of system median time
- `attempts_per_quest`: <= 1.2 (first-time success rate)

**Reasoning:**
User demonstrates mastery and rapid comprehension. Needs advanced challenges to maintain engagement and prevent boredom.

**Exit Condition:**
Average score drops below 85 or completion time increases above median.

---

### STATE: CONSISTENT
**Priority:** 4 (Default)

**Entry Conditions:**
```
(average_score BETWEEN 65.0 AND 90.0)
AND
(activity_frequency >= 2)
AND
(total_attempts >= 3)
AND
(NOT in any higher-priority state)
```

**Numeric Thresholds:**
- `average_score`: 65.0 - 90.0
- `activity_frequency`: >= 2 days in last 30 days
- `total_attempts`: >= 3

**Reasoning:**
User is making steady, healthy progress. Requires positive reinforcement and gradual difficulty progression.

**Exit Condition:**
Metrics shift to meet criteria for another state.

---

### STATE: NEWCOMER
**Priority:** 5 (Special case)

**Entry Conditions:**
```
(total_attempts < 3)
AND
(account_age < 7 days)
```

**Numeric Thresholds:**
- `total_attempts`: < 3
- `account_age`: < 7 days

**Reasoning:**
New user still in onboarding phase. Needs guided experience and encouragement.

**Exit Condition:**
Completes 3 or more quests.

---

## 2. Enhanced Analytics Metrics

### Required Additions to `learner_analytics` View:

```sql
-- New computed metrics
average_completion_time: AVG(completion_time) for last 30 days
attempts_per_quest: AVG(attempts) per unique quest
improvement_rate: (recent_avg_score - historical_avg_score) / historical_avg_score * 100
consecutive_successes: COUNT of quests with score >= 70 in a row
consecutive_failures: COUNT of quests with score < 50 in a row
system_median_time: PERCENTILE_CONT(0.5) of all completion times (global)
account_age: NOW() - created_at
last_state_change: Time since last learner_states update
```

---

## 3. State → Action Mapping Table

### DROP_RISK Actions

| Priority | Action Type | Trigger | Payload | Frequency |
|----------|-------------|---------|---------|-----------|
| 1 | `ASSIGN_RE_ENGAGEMENT_QUEST` | Immediate | `{"quest_id": "quest-1", "xp_bonus": 150}` | Once per state entry |
| 2 | `CREATE_NOTIFICATION` | Immediate | `{"message": "We miss you! Complete one quest to keep your streak alive.", "urgency": "high"}` | Once per state entry |
| 3 | `SEND_EMAIL_REMINDER` | After 3 days | `{"template": "re_engagement", "delay_hours": 72}` | Once per week max |
| 4 | `SET_UI_FLAG` | Immediate | `{"show_comeback_banner": true}` | Persistent until exit |

### STRUGGLING Actions

| Priority | Action Type | Trigger | Payload | Frequency |
|----------|-------------|---------|---------|-----------|
| 1 | `ASSIGN_REVISION_QUEST` | Immediate | `{"difficulty": "beginner", "topic": "weakest_topic"}` | Once per state entry |
| 2 | `SET_UI_FLAG` | Immediate | `{"leaderboard_view": "hidden", "show_hints": true}` | Persistent |
| 3 | `CREATE_NOTIFICATION` | After 2 failed attempts | `{"message": "Try our guided tutorial for this topic!", "action_link": "/tutorials"}` | Once per quest |
| 4 | `UNLOCK_HINT_SYSTEM` | Immediate | `{"hints_enabled": true, "max_hints": 3}` | Persistent |

### FAST_LEARNER Actions

| Priority | Action Type | Trigger | Payload | Frequency |
|----------|-------------|---------|---------|-----------|
| 1 | `ASSIGN_CHALLENGE_QUEST` | Immediate | `{"quest_id": "quest-6", "difficulty": "advanced"}` | Once per state entry |
| 2 | `SET_UI_FLAG` | Immediate | `{"leaderboard_view": "global", "show_peer_challenges": true}` | Persistent |
| 3 | `APPLY_XP_MULTIPLIER` | On next 3 quests | `{"multiplier": 1.5, "quest_count": 3}` | Once per week |
| 4 | `SUGGEST_PEER_CHALLENGE` | After 2 consecutive fast completions | `{"min_peer_score": 85}` | Once per 3 days |

### CONSISTENT Actions

| Priority | Action Type | Trigger | Payload | Frequency |
|----------|-------------|---------|---------|-----------|
| 1 | `APPLY_XP_BONUS` | Daily login | `{"bonus_xp": 50, "streak_multiplier": true}` | Once per day |
| 2 | `CREATE_NOTIFICATION` | Weekly milestone | `{"message": "Great progress! You've completed {count} quests this week.", "type": "celebration"}` | Once per week |
| 3 | `UNLOCK_NEXT_DIFFICULTY` | After 5 consecutive successes | `{"new_difficulty": "intermediate"}` | Once per difficulty tier |

### NEWCOMER Actions

| Priority | Action Type | Trigger | Payload | Frequency |
|----------|-------------|---------|---------|-----------|
| 1 | `SHOW_ONBOARDING_TUTORIAL` | First login | `{"tutorial_id": "getting_started"}` | Once |
| 2 | `ASSIGN_STARTER_QUEST` | Immediate | `{"quest_id": "quest-1"}` | Once |
| 3 | `SET_UI_FLAG` | Immediate | `{"show_tooltips": true, "guided_mode": true}` | Until 3 quests completed |

---

## 4. Decision Output Contract (JSON Schema)

```json
{
  "decision_id": "uuid",
  "user_id": "uuid",
  "timestamp": "ISO 8601 datetime",
  "detected_state": "FAST_LEARNER",
  "previous_state": "CONSISTENT",
  "state_changed": true,
  "confidence": 1.0,
  "analytics_snapshot": {
    "average_score": 92.5,
    "total_attempts": 15,
    "weekly_xp_earned": 650,
    "activity_frequency": 5,
    "average_completion_time": 180,
    "improvement_rate": 12.3
  },
  "actions": [
    {
      "action_id": "uuid",
      "type": "ASSIGN_CHALLENGE_QUEST",
      "priority": 1,
      "payload": {
        "quest_id": "quest-6",
        "difficulty": "advanced"
      },
      "trigger": "immediate",
      "frequency": "once_per_state_entry",
      "executed_at": "ISO 8601 datetime",
      "status": "executed"
    },
    {
      "action_id": "uuid",
      "type": "SET_UI_FLAG",
      "priority": 2,
      "payload": {
        "leaderboard_view": "global",
        "show_peer_challenges": true
      },
      "trigger": "immediate",
      "frequency": "persistent",
      "executed_at": "ISO 8601 datetime",
      "status": "executed"
    }
  ],
  "explanation": {
    "summary": "User promoted to FAST_LEARNER state due to exceptional performance",
    "detailed_reasoning": "User completed 15 quests in the last 30 days with an average score of 92.5%, earning 650 XP in the past week. Completion times are 40% faster than system median. This indicates mastery and rapid comprehension, warranting advanced challenges.",
    "metrics_used": [
      "average_score > 90.0 (92.5)",
      "weekly_xp_earned > 500 (650)",
      "completion_time < system_median * 0.7 (180s < 257s)"
    ],
    "actions_rationale": "Assigned advanced challenge quest to maintain engagement and prevent boredom. Enabled global leaderboard to foster healthy competition."
  },
  "fail_safes_applied": {
    "max_actions_per_day": 5,
    "current_actions_today": 2,
    "state_cooldown_hours": 24,
    "last_state_change": "2026-02-05T10:30:00Z"
  }
}
```

---

## 5. Fail-Safe Rules

### 5.1 Action Rate Limiting
```sql
-- Max actions per user per day
MAX_ACTIONS_PER_DAY = 10

-- Max notifications per user per day
MAX_NOTIFICATIONS_PER_DAY = 3

-- Max state changes per user per week
MAX_STATE_CHANGES_PER_WEEK = 2
```

### 5.2 State Cooldown Period
```sql
-- Minimum time between state changes (prevents oscillation)
STATE_COOLDOWN_HOURS = 24

-- Exception: DROP_RISK can override immediately
```

### 5.3 Priority Override Rules
```
IF (DROP_RISK detected) THEN
  Override all other states immediately
  Ignore cooldown period
  Execute high-priority actions
END IF

IF (multiple states match) THEN
  Select state with highest priority number
  Log conflict in decision_logs
END IF
```

### 5.4 Action Execution Safeguards
```sql
-- Prevent duplicate actions within time window
ON CONFLICT (user_id, action_type, created_at::date) DO NOTHING

-- Verify action prerequisites before execution
IF action requires quest THEN
  Check quest exists and is appropriate difficulty
END IF

-- Rollback on failure
BEGIN TRANSACTION
  Execute action
  Log decision
COMMIT OR ROLLBACK
```

---

## 6. Explainability Logic

### 6.1 Explanation Template Structure

```
{state_name} detected because:
- {metric_1_name}: {value} {comparison} {threshold} ({status})
- {metric_2_name}: {value} {comparison} {threshold} ({status})
- ...

Actions taken:
1. {action_type}: {human_readable_description}
   Reason: {action_rationale}
2. ...

Expected outcome:
{predicted_behavior_change}
```

### 6.2 Example Explanations

**DROP_RISK:**
```
DROP_RISK detected because:
- Last active: 16 days ago > 14 days threshold (FAIL)
- Activity frequency: 1 day < 2 days minimum (FAIL)

Actions taken:
1. ASSIGN_RE_ENGAGEMENT_QUEST: Assigned beginner Python quest with 150 XP bonus
   Reason: Low-friction, high-reward quest to encourage immediate return
2. CREATE_NOTIFICATION: Sent "We miss you!" message
   Reason: Direct engagement prompt with emotional appeal

Expected outcome:
User completes at least one quest within 7 days, transitioning to CONSISTENT state.
```

**STRUGGLING:**
```
STRUGGLING detected because:
- Average score: 58.3% < 65% threshold (FAIL)
- Total attempts: 12 >= 10 minimum (PASS)
- Improvement rate: -2.1% < 5% threshold (FAIL)

Actions taken:
1. ASSIGN_REVISION_QUEST: Assigned Python basics revision quest
   Reason: User's weakest topic is Python (avg 52%), needs foundational reinforcement
2. SET_UI_FLAG: Hidden leaderboard, enabled hints
   Reason: Reduce competitive pressure and provide scaffolding support

Expected outcome:
User completes revision quest with score > 70%, builds confidence, average score increases by 10+ points over next 5 quests.
```

**FAST_LEARNER:**
```
FAST_LEARNER detected because:
- Average score: 94.2% > 90% threshold (PASS)
- Weekly XP earned: 720 > 500 threshold (PASS)
- Completion time: 165s < 257s (70% of median) (PASS)
- Attempts per quest: 1.1 <= 1.2 (PASS)

Actions taken:
1. ASSIGN_CHALLENGE_QUEST: Unlocked advanced ML quest
   Reason: User demonstrates mastery, needs harder challenges to prevent boredom
2. APPLY_XP_MULTIPLIER: 1.5x XP for next 3 quests
   Reason: Reward exceptional performance, incentivize continued excellence

Expected outcome:
User maintains high performance on advanced content, remains engaged, potentially mentors struggling peers.
```

---

## 7. Database Schema Updates Required

### 7.1 Enhanced `learner_analytics` View
```sql
CREATE OR REPLACE VIEW public.learner_analytics_v2 AS
SELECT 
  p.id AS user_id,
  
  -- Existing metrics
  MAX(up.completed_at) AS last_active_at,
  COUNT(DISTINCT DATE(up.completed_at)) FILTER (WHERE up.completed_at > NOW() - INTERVAL '30 days') AS activity_frequency,
  AVG(up.score) FILTER (WHERE up.score IS NOT NULL AND up.completed_at > NOW() - INTERVAL '30 days') AS average_score,
  COUNT(up.id) FILTER (WHERE up.completed_at > NOW() - INTERVAL '30 days') AS total_attempts,
  SUM(q.xp) FILTER (WHERE up.completed = TRUE AND up.completed_at > NOW() - INTERVAL '7 days') AS weekly_xp_earned,
  
  -- NEW: Enhanced metrics
  AVG(up.time_spent) FILTER (WHERE up.completed_at > NOW() - INTERVAL '30 days') AS average_completion_time,
  AVG(up.attempts) FILTER (WHERE up.completed_at > NOW() - INTERVAL '30 days') AS attempts_per_quest,
  
  -- Improvement rate (recent vs historical)
  (
    AVG(up.score) FILTER (WHERE up.completed_at > NOW() - INTERVAL '7 days') -
    AVG(up.score) FILTER (WHERE up.completed_at BETWEEN NOW() - INTERVAL '30 days' AND NOW() - INTERVAL '7 days')
  ) / NULLIF(AVG(up.score) FILTER (WHERE up.completed_at BETWEEN NOW() - INTERVAL '30 days' AND NOW() - INTERVAL '7 days'), 0) * 100 AS improvement_rate,
  
  -- Account age
  EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 86400 AS account_age_days,
  
  -- Last state change
  EXTRACT(EPOCH FROM (NOW() - ls.computed_at)) / 3600 AS hours_since_last_state_change
  
FROM public.profiles p
LEFT JOIN public.user_progress up ON p.id = up.user_id
LEFT JOIN public.quests q ON up.quest_id = q.id
LEFT JOIN public.learner_states ls ON p.id = ls.user_id
GROUP BY p.id, ls.computed_at;
```

### 7.2 Action Execution Tracking Table
```sql
CREATE TABLE IF NOT EXISTS public.action_execution_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('executed', 'failed', 'skipped')),
  failure_reason TEXT,
  UNIQUE(user_id, action_type, executed_at::date) -- Prevent duplicates per day
);
```

### 7.3 Enhanced Decision Logs
```sql
ALTER TABLE public.decision_logs ADD COLUMN IF NOT EXISTS decision_json JSONB;
ALTER TABLE public.decision_logs ADD COLUMN IF NOT EXISTS explanation TEXT;
ALTER TABLE public.decision_logs ADD COLUMN IF NOT EXISTS analytics_snapshot JSONB;
```

---

## 8. Implementation Checklist

- [ ] Update `learner_analytics` view with new metrics
- [ ] Refactor `evaluate_and_assign_learner_states()` with strict priority rules
- [ ] Implement fail-safe checks in `execute_actions_for_user()`
- [ ] Add explanation generation logic
- [ ] Create `action_execution_log` table
- [ ] Update `action_mapping` seed data with comprehensive rules
- [ ] Add state cooldown enforcement
- [ ] Implement action rate limiting
- [ ] Create decision JSON output function
- [ ] Add unit tests for state detection logic
- [ ] Document all thresholds in configuration table

---

## 9. Testing Scenarios

### Test Case 1: DROP_RISK Detection
```
Given: User last active 15 days ago
When: State evaluation runs
Then: State = DROP_RISK
And: Re-engagement quest assigned
And: Notification sent
```

### Test Case 2: State Priority Override
```
Given: User meets STRUGGLING criteria (score=60, attempts=12)
And: User also meets DROP_RISK criteria (inactive 20 days)
When: State evaluation runs
Then: State = DROP_RISK (higher priority)
And: STRUGGLING actions NOT executed
```

### Test Case 3: Action Rate Limiting
```
Given: User already received 3 notifications today
When: New action requires notification
Then: Notification skipped
And: Logged as "rate_limited" in action_execution_log
```

### Test Case 4: State Cooldown
```
Given: User state changed to FAST_LEARNER 12 hours ago
When: Metrics now indicate CONSISTENT
Then: State change deferred
And: Re-evaluated after 24-hour cooldown
```

---

## 10. Configuration Parameters (Tunable)

```sql
CREATE TABLE IF NOT EXISTS public.system_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.system_config (key, value, description) VALUES
  ('drop_risk_inactivity_days', '14', 'Days of inactivity before DROP_RISK'),
  ('struggling_score_threshold', '65.0', 'Score below which user is STRUGGLING'),
  ('fast_learner_score_threshold', '90.0', 'Score above which user is FAST_LEARNER'),
  ('max_actions_per_day', '10', 'Maximum actions per user per day'),
  ('state_cooldown_hours', '24', 'Hours between state changes'),
  ('max_notifications_per_day', '3', 'Maximum notifications per user per day');
```
