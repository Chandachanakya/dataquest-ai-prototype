-- 1. SEED QUESTS
INSERT INTO public.quests (id, title, description, difficulty, topic, xp, type) VALUES
  ('quest-1', 'Python for Data Science Init', 'Master the foundational Python concepts essential for data analysis', 'beginner', 'python', 100, 'quiz'),
  ('quest-2', 'NumPy Ninja', 'Understand arrays and vectorization with NumPy', 'beginner', 'numpy', 150, 'code'),
  ('quest-3', 'Pandas Power', 'Data manipulation and analysis with Pandas DataFrames', 'intermediate', 'pandas', 200, 'quiz'),
  ('quest-4', 'Data Cleaning Challenge', 'Handle missing values and duplicates effectively', 'intermediate', 'data-cleaning', 250, 'code'),
  ('quest-5', 'Visualization Voyager', 'Principles of data visualization with Matplotlib and Seaborn', 'beginner', 'visualization', 120, 'quiz'),
  ('quest-6', 'Machine Learning Concept Check', 'Test your knowledge of core ML concepts', 'advanced', 'machine-learning', 300, 'quiz'),
  ('quest-7', 'Introduction to SQL for Data', 'Querying databases for analysis', 'beginner', 'sql', 100, 'quiz'),
  ('quest-8', 'Linear Regression Logic', 'Understand the math behind the line of best fit', 'advanced', 'machine-learning', 250, 'code'),
  ('quest-99', 'Revision Quest - Fundamentals', 'Review and strengthen your foundational knowledge', 'beginner', 'revision', 80, 'quiz')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  difficulty = EXCLUDED.difficulty,
  topic = EXCLUDED.topic,
  xp = EXCLUDED.xp,
  type = EXCLUDED.type;

-- 2. PHASE 2: COMPREHENSIVE ACTION MAPPING (20+ Rules)
INSERT INTO public.action_mapping (learner_state, action_type, priority, action_payload, description)
VALUES
  -- ========== DROP_RISK State (Priority 1 - Retention Critical) ==========
  ('DROP_RISK', 'ASSIGN_RE_ENGAGEMENT_QUEST', 1, '{"quest_id": "quest-1", "xp_bonus": 150}', 'Assign a simple, high-reward quest to encourage immediate return'),
  ('DROP_RISK', 'CREATE_NOTIFICATION', 2, '{"message": "We miss you! Complete one quest to keep your streak alive 🔥", "urgency": "high"}', 'Send urgent in-app nudge to create sense of urgency'),
  ('DROP_RISK', 'SET_UI_FLAG', 3, '{"show_comeback_banner": true, "hide_leaderboard": true}', 'Show comeback banner, hide potentially discouraging leaderboard'),

  -- ========== NEWCOMER State (Priority 2 - Onboarding) ==========
  ('NEWCOMER', 'ASSIGN_STARTER_QUEST', 1, '{"quest_id": "quest-1"}', 'Assign first beginner quest to get started'),
  ('NEWCOMER', 'SET_UI_FLAG', 2, '{"show_tooltips": true, "guided_mode": true, "show_welcome": true}', 'Enable guided onboarding experience with tooltips'),
  ('NEWCOMER', 'CREATE_NOTIFICATION', 3, '{"message": "Welcome! Start your learning journey with your first quest 🎯"}', 'Welcome message to encourage first quest'),

  -- ========== STRUGGLING State (Priority 3 - Support Needed) ==========
  ('STRUGGLING', 'ASSIGN_REVISION_QUEST', 1, '{"quest_id": "quest-99", "topic": "fundamentals"}', 'Auto-assign revision quest for foundational concepts'),
  ('STRUGGLING', 'SET_UI_FLAG', 2, '{"leaderboard_view": "hidden", "show_hints": true, "difficulty_assist": true}', 'Hide leaderboard, enable hints to reduce pressure'),
  ('STRUGGLING', 'CREATE_NOTIFICATION', 3, '{"message": "Need help? Try our guided tutorials for this topic 📚", "action_link": "/tutorials"}', 'Suggest tutorials for struggling learners'),

  -- ========== FAST_LEARNER State (Priority 4 - Challenge Needed) ==========
  ('FAST_LEARNER', 'ASSIGN_CHALLENGE_QUEST', 1, '{"quest_id": "quest-6"}', 'Unlock advanced challenge quest to maintain engagement'),
  ('FAST_LEARNER', 'SET_UI_FLAG', 2, '{"leaderboard_view": "global", "show_peer_challenges": true, "competitive_mode": true}', 'Enable global leaderboard and competitive features'),
  ('FAST_LEARNER', 'APPLY_XP_MULTIPLIER', 3, '{"multiplier": 1.5, "quest_count": 3, "duration_hours": 72}', 'Apply 1.5x XP multiplier for next 3 quests as reward'),
  ('FAST_LEARNER', 'CREATE_NOTIFICATION', 4, '{"message": "Amazing progress! You''ve unlocked advanced challenges 🚀"}', 'Celebrate achievement and notify about new content'),

  -- ========== CONSISTENT State (Priority 5 - Positive Reinforcement) ==========
  ('CONSISTENT', 'APPLY_XP_BONUS', 1, '{"bonus_xp": 50, "streak_based": true}', 'Daily XP bonus for consistent learners'),
  ('CONSISTENT', 'SET_UI_FLAG', 2, '{"show_progress_tracker": true, "milestone_notifications": true}', 'Show progress tracking and milestone celebrations'),
  ('CONSISTENT', 'CREATE_NOTIFICATION', 3, '{"message": "Great work! Keep up the steady progress 💪", "type": "encouragement"}', 'Weekly encouragement message')

ON CONFLICT (learner_state, action_type) DO UPDATE SET
  priority = EXCLUDED.priority,
  action_payload = EXCLUDED.action_payload,
  description = EXCLUDED.description;

-- 3. PHASE 2: SYSTEM CONFIGURATION (Tunable Parameters)
INSERT INTO public.system_config (key, value, description) VALUES
  ('drop_risk_inactivity_days', '14', 'Days of inactivity before user is marked as DROP_RISK'),
  ('drop_risk_low_frequency', '2', 'Minimum active days per month to avoid DROP_RISK'),
  ('struggling_score_threshold', '65.0', 'Average score below which user is considered STRUGGLING'),
  ('struggling_min_attempts', '10', 'Minimum attempts required before STRUGGLING state applies'),
  ('fast_learner_score_threshold', '90.0', 'Average score above which user is FAST_LEARNER'),
  ('fast_learner_min_xp', '500', 'Minimum weekly XP for FAST_LEARNER status'),
  ('newcomer_max_attempts', '3', 'Maximum attempts before user exits NEWCOMER state'),
  ('newcomer_max_age_days', '7', 'Maximum account age (days) for NEWCOMER state'),
  ('state_cooldown_hours', '24', 'Hours between state changes (prevents oscillation)'),
  ('max_actions_per_day', '10', 'Maximum actions executed per user per day'),
  ('max_notifications_per_day', '3', 'Maximum notifications sent per user per day')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = NOW();

