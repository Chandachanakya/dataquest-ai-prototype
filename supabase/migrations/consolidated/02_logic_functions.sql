-- 1. UTILITY FUNCTIONS
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 2. PROFILE MANAGEMENT
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, created_at, updated_at)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'username', 'DataQuester'),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$;

-- Triggers (Conditional Drop to avoid errors on re-run)
DO $$ BEGIN
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
EXCEPTION WHEN undefined_object THEN NULL; END $$;

DO $$ BEGIN
  DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
  CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
EXCEPTION WHEN undefined_object THEN NULL; END $$;

-- 3. LEARNER INTELLIGENCE (Enhanced Analytics View - Phase 2)
CREATE OR REPLACE VIEW public.learner_analytics AS
SELECT 
  p.id AS user_id,
  
  -- Core activity metrics
  MAX(up.completed_at) AS last_active_at,
  COUNT(DISTINCT DATE(up.completed_at)) FILTER (WHERE up.completed_at > NOW() - INTERVAL '30 days') AS activity_frequency,
  AVG(up.score) FILTER (WHERE up.score IS NOT NULL AND up.completed_at > NOW() - INTERVAL '30 days') AS average_score,
  COUNT(up.id) FILTER (WHERE up.completed_at > NOW() - INTERVAL '30 days') AS total_attempts,
  SUM(q.xp) FILTER (WHERE up.completed = TRUE AND up.completed_at > NOW() - INTERVAL '7 days') AS weekly_xp_earned,
  
  -- PHASE 2: Enhanced metrics
  AVG(up.time_spent) FILTER (WHERE up.completed_at > NOW() - INTERVAL '30 days' AND up.time_spent > 0) AS average_completion_time,
  AVG(up.attempts) FILTER (WHERE up.completed_at > NOW() - INTERVAL '30 days' AND up.attempts > 0) AS attempts_per_quest,
  
  -- Improvement rate: (recent avg - historical avg) / historical avg * 100
  CASE 
    WHEN AVG(up.score) FILTER (WHERE up.completed_at BETWEEN NOW() - INTERVAL '30 days' AND NOW() - INTERVAL '7 days') > 0 THEN
      ((AVG(up.score) FILTER (WHERE up.completed_at > NOW() - INTERVAL '7 days') - 
        AVG(up.score) FILTER (WHERE up.completed_at BETWEEN NOW() - INTERVAL '30 days' AND NOW() - INTERVAL '7 days')) / 
       NULLIF(AVG(up.score) FILTER (WHERE up.completed_at BETWEEN NOW() - INTERVAL '30 days' AND NOW() - INTERVAL '7 days'), 0)) * 100
    ELSE 0
  END AS improvement_rate,
  
  -- Account age in days
  EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 86400 AS account_age_days,
  
  -- Time since last state change (hours)
  EXTRACT(EPOCH FROM (NOW() - COALESCE(ls.computed_at, p.created_at))) / 3600 AS hours_since_last_state_change,
  
  -- Previous state for transition tracking
  ls.state AS current_state
  
FROM 
  public.profiles p
LEFT JOIN 
  public.user_progress up ON p.id = up.user_id
LEFT JOIN
  public.quests q ON up.quest_id = q.id
LEFT JOIN
  public.learner_states ls ON p.id = ls.user_id
GROUP BY 
  p.id, p.created_at, ls.computed_at, ls.state;

-- 4. ACTION EXECUTION LOGIC (Phase 2 Enhanced with Fail-Safes)
CREATE OR REPLACE FUNCTION public.execute_actions_for_user(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_learner_state TEXT;
  state_reason TEXT;
  action_record RECORD;
  actions_today INT := 0;
  notifications_today INT := 0;
  MAX_ACTIONS_PER_DAY INT := 10;
  MAX_NOTIFICATIONS_PER_DAY INT := 3;
BEGIN
  -- Get state
  SELECT state, reason INTO current_learner_state, state_reason
  FROM public.learner_states
  WHERE user_id = target_user_id;

  IF NOT FOUND THEN RETURN; END IF;

  -- FAIL-SAFE: Check action rate limit
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'action_execution_log') THEN
    SELECT COUNT(*) INTO actions_today
    FROM public.action_execution_log
    WHERE user_id = target_user_id 
      AND executed_at::date = CURRENT_DATE
      AND status = 'executed';
    
    IF actions_today >= MAX_ACTIONS_PER_DAY THEN
      -- Log rate limit hit
      INSERT INTO public.action_execution_log (user_id, action_type, status, failure_reason)
      VALUES (target_user_id, 'RATE_LIMIT_CHECK', 'skipped', 'Max actions per day reached: ' || actions_today);
      RETURN;
    END IF;
  END IF;

  -- Execute actions
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'action_mapping') THEN
      FOR action_record IN 
        SELECT * 
        FROM public.action_mapping
        WHERE learner_state = current_learner_state
        ORDER BY priority ASC
      LOOP
        -- FAIL-SAFE: Check if action already executed today (prevent duplicates)
        IF EXISTS (
          SELECT 1 FROM public.action_execution_log
          WHERE user_id = target_user_id
            AND action_type = action_record.action_type
            AND executed_at::date = CURRENT_DATE
            AND status = 'executed'
        ) THEN
          CONTINUE; -- Skip duplicate action
        END IF;

        -- FAIL-SAFE: Check notification rate limit
        IF action_record.action_type = 'CREATE_NOTIFICATION' THEN
          SELECT COUNT(*) INTO notifications_today
          FROM public.action_execution_log
          WHERE user_id = target_user_id
            AND action_type = 'CREATE_NOTIFICATION'
            AND executed_at::date = CURRENT_DATE
            AND status = 'executed';
          
          IF notifications_today >= MAX_NOTIFICATIONS_PER_DAY THEN
            INSERT INTO public.action_execution_log (user_id, action_type, status, failure_reason)
            VALUES (target_user_id, action_record.action_type, 'skipped', 'Max notifications per day reached');
            CONTINUE;
          END IF;
        END IF;

        -- Log action BEFORE executing
        INSERT INTO public.action_logs (user_id, learner_state, action_type, reason)
        VALUES (target_user_id, current_learner_state, action_record.action_type, state_reason);

        -- Execute the action with error handling
        BEGIN
          CASE action_record.action_type
            WHEN 'ASSIGN_RE_ENGAGEMENT_QUEST' THEN
              INSERT INTO public.user_progress (user_id, quest_id, completed)
              VALUES (target_user_id, (action_record.action_payload->>'quest_id'), false)
              ON CONFLICT (user_id, quest_id) DO NOTHING;

            WHEN 'ASSIGN_REVISION_QUEST' THEN
              INSERT INTO public.user_progress (user_id, quest_id, completed)
              VALUES (target_user_id, 'quest-99', false)
              ON CONFLICT (user_id, quest_id) DO NOTHING;

            WHEN 'ASSIGN_CHALLENGE_QUEST' THEN
              INSERT INTO public.user_progress (user_id, quest_id, completed)
              VALUES (target_user_id, (action_record.action_payload->>'quest_id'), false)
              ON CONFLICT (user_id, quest_id) DO NOTHING;

            WHEN 'ASSIGN_STARTER_QUEST' THEN
              INSERT INTO public.user_progress (user_id, quest_id, completed)
              VALUES (target_user_id, (action_record.action_payload->>'quest_id'), false)
              ON CONFLICT (user_id, quest_id) DO NOTHING;

            WHEN 'CREATE_NOTIFICATION' THEN
               IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications') THEN
                  INSERT INTO public.notifications (user_id, message, read)
                  VALUES (target_user_id, action_record.action_payload->>'message', false)
                  ON CONFLICT (user_id, message) DO NOTHING;
               END IF;

            WHEN 'SET_UI_FLAG' THEN
              UPDATE public.profiles
              SET ui_flags = ui_flags || (action_record.action_payload)::jsonb
              WHERE id = target_user_id;

            WHEN 'APPLY_XP_BONUS', 'APPLY_XP_MULTIPLIER' THEN
              -- Store in ui_flags for frontend to apply
              UPDATE public.profiles
              SET ui_flags = ui_flags || jsonb_build_object(
                'xp_bonus', action_record.action_payload
              )
              WHERE id = target_user_id;

            ELSE
              NULL;
          END CASE;

          -- Log successful execution
          INSERT INTO public.action_execution_log (user_id, action_type, status)
          VALUES (target_user_id, action_record.action_type, 'executed');

        EXCEPTION WHEN OTHERS THEN
          -- Log failure
          INSERT INTO public.action_execution_log (user_id, action_type, status, failure_reason)
          VALUES (target_user_id, action_record.action_type, 'failed', SQLERRM);
        END;

      END LOOP;
  END IF;
END;
$$;

-- 5. STATE EVALUATION LOGIC (Phase 2 Enhanced)
CREATE OR REPLACE FUNCTION public.evaluate_and_assign_learner_states()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  -- Configurable thresholds (read from system_config if available)
  DROP_RISK_INACTIVITY_DAYS INT := 14;
  DROP_RISK_LOW_FREQ INT := 2;
  STRUGGLING_AVG_SCORE REAL := 65.0;
  STRUGGLING_MIN_ATTEMPTS INT := 10;
  FAST_AVG_SCORE REAL := 90.0;
  FAST_MIN_XP REAL := 500.0;
  FAST_TIME_MULTIPLIER REAL := 0.7;
  NEWCOMER_MAX_ATTEMPTS INT := 3;
  NEWCOMER_MAX_AGE_DAYS INT := 7;
  STATE_COOLDOWN_HOURS INT := 24;

BEGIN
  -- Load config from system_config table if it exists
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'system_config') THEN
    SELECT (value::text)::int INTO DROP_RISK_INACTIVITY_DAYS FROM public.system_config WHERE key = 'drop_risk_inactivity_days';
    SELECT (value::text)::real INTO STRUGGLING_AVG_SCORE FROM public.system_config WHERE key = 'struggling_score_threshold';
    SELECT (value::text)::real INTO FAST_AVG_SCORE FROM public.system_config WHERE key = 'fast_learner_score_threshold';
    SELECT (value::text)::int INTO STATE_COOLDOWN_HOURS FROM public.system_config WHERE key = 'state_cooldown_hours';
  END IF;

  WITH computed_states AS (
    SELECT
      user_id,
      last_active_at,
      activity_frequency,
      average_score,
      total_attempts,
      weekly_xp_earned,
      average_completion_time,
      attempts_per_quest,
      improvement_rate,
      account_age_days,
      hours_since_last_state_change,
      current_state,
      
      -- State detection with strict priority (1 = highest)
      CASE
        -- PRIORITY 1: DROP_RISK (overrides all others, ignores cooldown)
        WHEN (last_active_at < (NOW() - (DROP_RISK_INACTIVITY_DAYS || ' days')::interval) OR last_active_at IS NULL)
          THEN jsonb_build_object(
            'state', 'DROP_RISK',
            'priority', 1,
            'reason', 'User has been inactive for over ' || DROP_RISK_INACTIVITY_DAYS || ' days. Last active: ' || COALESCE(last_active_at::text, 'never') || '.',
            'metrics', jsonb_build_object(
              'last_active_at', COALESCE(last_active_at::text, 'never'),
              'threshold', DROP_RISK_INACTIVITY_DAYS || ' days'
            )
          )
        
        WHEN (activity_frequency < DROP_RISK_LOW_FREQ AND last_active_at IS NOT NULL)
          THEN jsonb_build_object(
            'state', 'DROP_RISK',
            'priority', 1,
            'reason', 'Low engagement: User has been active on only ' || activity_frequency || ' days in the last month (minimum: ' || DROP_RISK_LOW_FREQ || ' days).',
            'metrics', jsonb_build_object(
              'activity_frequency', activity_frequency,
              'threshold', DROP_RISK_LOW_FREQ
            )
          )
        
        -- PRIORITY 2: NEWCOMER (special case for new users)
        WHEN (total_attempts < NEWCOMER_MAX_ATTEMPTS AND account_age_days < NEWCOMER_MAX_AGE_DAYS)
          THEN jsonb_build_object(
            'state', 'NEWCOMER',
            'priority', 2,
            'reason', 'New user in onboarding phase. Account age: ' || ROUND(account_age_days::numeric, 1) || ' days, attempts: ' || total_attempts || '.',
            'metrics', jsonb_build_object(
              'account_age_days', ROUND(account_age_days::numeric, 1),
              'total_attempts', total_attempts,
              'max_attempts', NEWCOMER_MAX_ATTEMPTS,
              'max_age_days', NEWCOMER_MAX_AGE_DAYS
            )
          )
        
        -- PRIORITY 3: STRUGGLING
        WHEN (average_score < STRUGGLING_AVG_SCORE AND total_attempts >= STRUGGLING_MIN_ATTEMPTS)
          THEN jsonb_build_object(
            'state', 'STRUGGLING',
            'priority', 3,
            'reason', 'Low performance: Average score is ' || ROUND(average_score::numeric, 1) || '% (below ' || STRUGGLING_AVG_SCORE || '%) despite ' || total_attempts || ' recent attempts.',
            'metrics', jsonb_build_object(
              'average_score', ROUND(average_score::numeric, 1),
              'threshold', STRUGGLING_AVG_SCORE,
              'total_attempts', total_attempts,
              'improvement_rate', ROUND(COALESCE(improvement_rate, 0)::numeric, 1)
            )
          )
        
        -- PRIORITY 4: FAST_LEARNER
        WHEN (average_score > FAST_AVG_SCORE AND weekly_xp_earned > FAST_MIN_XP)
          THEN jsonb_build_object(
            'state', 'FAST_LEARNER',
            'priority', 4,
            'reason', 'High performance: Average score is ' || ROUND(average_score::numeric, 1) || '% (above ' || FAST_AVG_SCORE || '%) with rapid XP gain (' || weekly_xp_earned || ' XP this week).',
            'metrics', jsonb_build_object(
              'average_score', ROUND(average_score::numeric, 1),
              'threshold', FAST_AVG_SCORE,
              'weekly_xp_earned', weekly_xp_earned,
              'min_xp', FAST_MIN_XP
            )
          )
        
        -- PRIORITY 5: CONSISTENT (default)
        ELSE 
          jsonb_build_object(
            'state', 'CONSISTENT',
            'priority', 5,
            'reason', 'User is making steady and consistent progress. Average score: ' || ROUND(COALESCE(average_score, 0)::numeric, 1) || '%, activity: ' || activity_frequency || ' days/month.',
            'metrics', jsonb_build_object(
              'average_score', ROUND(COALESCE(average_score, 0)::numeric, 1),
              'activity_frequency', activity_frequency,
              'total_attempts', total_attempts
            )
          )
      END AS result
    FROM public.learner_analytics
  ),
  states_inserted AS (
    -- Insert or update learner states with cooldown check
    INSERT INTO public.learner_states (user_id, state, reason, computed_at)
    SELECT 
      cs.user_id, 
      cs.result->>'state',
      cs.result->>'reason',
      NOW()
    FROM computed_states cs
    WHERE 
      -- Allow state change if:
      -- 1. No existing state (new user)
      -- 2. State is changing to DROP_RISK (emergency override)
      -- 3. Cooldown period has passed
      -- 4. State is actually different
      (cs.current_state IS NULL) OR
      (cs.result->>'state' = 'DROP_RISK') OR
      (cs.hours_since_last_state_change > STATE_COOLDOWN_HOURS) OR
      (cs.current_state != cs.result->>'state')
    ON CONFLICT (user_id) DO UPDATE 
      SET 
        state = EXCLUDED.state, 
        reason = EXCLUDED.reason, 
        computed_at = NOW()
      WHERE 
        -- Only update if state actually changed or DROP_RISK
        (learner_states.state != EXCLUDED.state) OR
        (EXCLUDED.state = 'DROP_RISK')
    RETURNING user_id
  )
  -- Log decisions with full analytics snapshot
  INSERT INTO public.decision_logs (user_id, state_detected, action_taken, reason, metadata, explanation, analytics_snapshot, previous_state, timestamp)
  SELECT 
    cs.user_id,
    cs.result->>'state',
    'STATE_EVALUATION',
    cs.result->>'reason',
    cs.result->'metrics',
    'State: ' || cs.result->>'state' || E'\n' || 
    'Reason: ' || cs.result->>'reason' || E'\n' ||
    'Metrics: ' || (cs.result->'metrics')::text,
    jsonb_build_object(
      'average_score', cs.average_score,
      'total_attempts', cs.total_attempts,
      'activity_frequency', cs.activity_frequency,
      'weekly_xp_earned', cs.weekly_xp_earned,
      'improvement_rate', cs.improvement_rate,
      'account_age_days', cs.account_age_days
    ),
    cs.current_state,
    NOW()
  FROM computed_states cs
  INNER JOIN states_inserted si ON cs.user_id = si.user_id;
    
END;
$$;

-- 6. TRIGGER FOR AUTOMATION
CREATE OR REPLACE FUNCTION public.trigger_action_execution()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM public.execute_actions_for_user(NEW.user_id);
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  DROP TRIGGER IF EXISTS on_learner_state_change ON public.learner_states;
  CREATE TRIGGER on_learner_state_change
    AFTER INSERT OR UPDATE ON public.learner_states
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_action_execution();
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- 7. SCHEDULE (Requires pg_cron)
-- SELECT cron.schedule('daily-learner-state-evaluation', '0 0 * * *', 'SELECT public.evaluate_and_assign_learner_states();');
