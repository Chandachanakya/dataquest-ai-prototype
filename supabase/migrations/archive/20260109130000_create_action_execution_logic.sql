--
-- 1. Create the function to execute actions for a single user.
-- This function is designed to be idempotent and fully auditable.
--
CREATE OR REPLACE FUNCTION public.execute_actions_for_user(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_learner_state TEXT;
  state_reason TEXT;
  action_record RECORD;
BEGIN
  -- Get the user's current state and the reason it was assigned.
  SELECT state, reason INTO current_learner_state, state_reason
  FROM public.learner_states
  WHERE user_id = target_user_id;

  -- If no state is found, exit.
  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Loop through all actions defined for the current state, ordered by priority.
  FOR action_record IN 
    SELECT * 
    FROM public.action_mapping
    WHERE learner_state = current_learner_state
    ORDER BY priority ASC
  LOOP
    -- Log the action before executing it. This ensures a record exists even if execution fails.
    INSERT INTO public.action_logs (user_id, learner_state, action_type, reason)
    VALUES (target_user_id, current_learner_state, action_record.action_type, state_reason);

    -- == Execute the action based on its type ==
    -- This CASE statement is the core of the action execution.
    CASE action_record.action_type
      WHEN 'ASSIGN_RE_ENGAGEMENT_QUEST' THEN
        -- Idempotently assign a quest. If the user already has it, do nothing.
        INSERT INTO public.user_progress (user_id, quest_id, status)
        VALUES (target_user_id, (action_record.action_payload->>'quest_id')::INT, 'not_started')
        ON CONFLICT (user_id, quest_id) DO NOTHING;

      WHEN 'ASSIGN_REVISION_QUEST' THEN
        -- This is a placeholder for more complex logic that would select
        -- a revision quest based on the user's specific weak topic.
        INSERT INTO public.user_progress (user_id, quest_id, status)
        VALUES (target_user_id, 99, 'not_started') -- 99 is a generic revision quest
        ON CONFLICT (user_id, quest_id) DO NOTHING;

      WHEN 'ASSIGN_CHALLENGE_QUEST' THEN
        INSERT INTO public.user_progress (user_id, quest_id, status)
        VALUES (target_user_id, (action_record.action_payload->>'quest_id')::INT, 'not_started')
        ON CONFLICT (user_id, quest_id) DO NOTHING;

      WHEN 'CREATE_NOTIFICATION' THEN
        -- Idempotently create an in-app notification.
        INSERT INTO public.notifications (user_id, message, read)
        VALUES (target_user_id, action_record.action_payload->>'message', false)
        ON CONFLICT (user_id, message) DO NOTHING; -- Prevents duplicate notifications.

      WHEN 'SET_UI_FLAG' THEN
        -- Update the user's profile with the specified UI flag (e.g., leaderboard view).
        UPDATE public.profiles
        SET ui_flags = ui_flags || (action_record.action_payload)::jsonb
        WHERE id = target_user_id;

      WHEN 'APPLY_XP_BONUS' THEN
        -- Logic to apply an XP bonus would go here.
        -- This could involve creating a temporary record in a `user_bonuses` table.
        -- For this example, we'll just log it.
        NULL;

      ELSE
        -- Do nothing for unhandled action types.
        NULL;
    END CASE;

  END LOOP;
END;
$$;

--
-- 2. Create a trigger function to run action execution after state evaluation.
--
CREATE OR REPLACE FUNCTION public.trigger_action_execution()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Call the action execution function for the user whose state was just updated.
  PERFORM public.execute_actions_for_user(NEW.user_id);
  RETURN NEW;
END;
$$;

--
-- 3. Create a trigger on the learner_states table.
-- This ensures that actions are automatically executed whenever a user's state is inserted or updated.
--
CREATE TRIGGER on_learner_state_change
  AFTER INSERT OR UPDATE ON public.learner_states
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_action_execution();

