-- Simulation Data Generator
-- This script creates test data to demonstrate different learner states
-- Run this AFTER creating a test user account

-- Instructions:
-- 1. Sign up with a test account (e.g., test@example.com)
-- 2. Get your user_id from the profiles table:
--    SELECT id, username FROM profiles WHERE username = 'your_username';
-- 3. Replace 'YOUR_USER_ID_HERE' below with your actual user_id
-- 4. Run this script in Supabase SQL Editor
-- 5. Run the learner state evaluation function:
--    SELECT public.evaluate_and_assign_learner_states();

-- ============================================
-- SCENARIO 1: STRUGGLING LEARNER
-- ============================================
-- Simulates a user with low scores and multiple attempts

DO $$
DECLARE
  test_user_id UUID := 'a405c67f-3eae-4a68-bbc2-97c7a3fc7f83'; -- REPLACE THIS WITH YOUR USER ID
BEGIN
  -- Clear any existing data for this user
  DELETE FROM public.quest_attempts WHERE user_id = test_user_id;
  DELETE FROM public.user_course_progress WHERE user_id = test_user_id;

  -- Insert multiple low-scoring attempts using actual quest IDs
  INSERT INTO public.quest_attempts (user_id, quest_id, started_at, completed_at, score, completion_time, status)
  VALUES
    -- Quest 1: Multiple attempts, low scores (quest-1 = 100 XP)
    (test_user_id, 'quest-1', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', 35, 420, 'completed'),
    (test_user_id, 'quest-1', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days', 42, 380, 'completed'),
    (test_user_id, 'quest-1', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', 48, 360, 'completed'),
    
    -- Quest 2: Low score (quest-2 = 150 XP)
    (test_user_id, 'quest-2', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', 38, 450, 'completed'),
    
    -- Quest 3: Another low score (quest-3 = 200 XP)
    (test_user_id, 'quest-3', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', 44, 400, 'completed');

  -- Update user_course_progress to match (using course_id as quest_id)
  INSERT INTO public.user_course_progress (user_id, course_id, module_id, lesson_id, completed_at, quiz_score)
  VALUES
    (test_user_id, 'quest-1', 1, 1, NOW() - INTERVAL '3 days', 48),
    (test_user_id, 'quest-2', 1, 2, NOW() - INTERVAL '2 days', 38),
    (test_user_id, 'quest-3', 1, 3, NOW() - INTERVAL '1 day', 44)
  ON CONFLICT (user_id, course_id, module_id, lesson_id) DO UPDATE
    SET quiz_score = EXCLUDED.quiz_score,
        completed_at = EXCLUDED.completed_at;

  -- Update user_progress (for Dashboard checkboxes)
  INSERT INTO public.user_progress (user_id, quest_id, completed, score, xp_earned, attempts, completed_at)
  VALUES
    (test_user_id, 'quest-1', true, 48, 100, 3, NOW() - INTERVAL '3 days'),
    (test_user_id, 'quest-2', true, 38, 150, 1, NOW() - INTERVAL '2 days'),
    (test_user_id, 'quest-3', true, 44, 200, 1, NOW() - INTERVAL '1 day')
  ON CONFLICT (user_id, quest_id) DO UPDATE
    SET score = EXCLUDED.score,
        completed_at = EXCLUDED.completed_at;

  RAISE NOTICE 'STRUGGLING learner data created successfully';
END $$;

-- ============================================
-- SCENARIO 2: FAST LEARNER
-- ============================================
-- Simulates a user with high scores and quick completion times

DO $$
DECLARE
  test_user_id UUID := 'af2545df-cfd1-41fa-b655-de8a1074d402'; -- REPLACE THIS WITH YOUR USER ID
BEGIN
  -- Clear previous data
  DELETE FROM public.quest_attempts WHERE user_id = test_user_id;
  DELETE FROM public.user_course_progress WHERE user_id = test_user_id;

  -- Insert high-scoring attempts with fast completion times
  INSERT INTO public.quest_attempts (user_id, quest_id, started_at, completed_at, score, completion_time, status)
  VALUES
    (test_user_id, 'quest-1', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days', 95, 180, 'completed'),
    (test_user_id, 'quest-2', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days', 92, 165, 'completed'),
    (test_user_id, 'quest-3', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', 98, 150, 'completed'),
    (test_user_id, 'quest-4', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days', 100, 140, 'completed'),
    (test_user_id, 'quest-5', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', 94, 160, 'completed'),
    (test_user_id, 'quest-6', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', 96, 155, 'completed');

  -- Update user_course_progress
  INSERT INTO public.user_course_progress (user_id, course_id, module_id, lesson_id, completed_at, quiz_score)
  VALUES
    (test_user_id, 'quest-1', 1, 1, NOW() - INTERVAL '7 days', 95),
    (test_user_id, 'quest-2', 1, 2, NOW() - INTERVAL '6 days', 92),
    (test_user_id, 'quest-3', 1, 3, NOW() - INTERVAL '5 days', 98),
    (test_user_id, 'quest-4', 1, 4, NOW() - INTERVAL '4 days', 100),
    (test_user_id, 'quest-5', 1, 5, NOW() - INTERVAL '3 days', 94),
    (test_user_id, 'quest-6', 1, 6, NOW() - INTERVAL '2 days', 96)
  ON CONFLICT (user_id, course_id, module_id, lesson_id) DO UPDATE
    SET quiz_score = EXCLUDED.quiz_score,
        completed_at = EXCLUDED.completed_at;

  -- Update user_progress (for Dashboard checkboxes)
  INSERT INTO public.user_progress (user_id, quest_id, completed, score, xp_earned, attempts, completed_at)
  VALUES
    (test_user_id, 'quest-1', true, 95, 100, 1, NOW() - INTERVAL '7 days'),
    (test_user_id, 'quest-2', true, 92, 150, 1, NOW() - INTERVAL '6 days'),
    (test_user_id, 'quest-3', true, 98, 200, 1, NOW() - INTERVAL '5 days'),
    (test_user_id, 'quest-4', true, 100, 250, 1, NOW() - INTERVAL '4 days'),
    (test_user_id, 'quest-5', true, 94, 120, 1, NOW() - INTERVAL '3 days'),
    (test_user_id, 'quest-6', true, 96, 300, 1, NOW() - INTERVAL '2 days')
  ON CONFLICT (user_id, quest_id) DO UPDATE
    SET score = EXCLUDED.score,
        completed_at = EXCLUDED.completed_at;

  -- Update profile XP
  UPDATE public.profiles
  SET xp = 575, total_xp = 575, completed_quests = 6
  WHERE id = test_user_id;

  RAISE NOTICE 'FAST learner data created successfully';
END $$;

-- ============================================
-- SCENARIO 3: DROP RISK (INACTIVE)
-- ============================================
-- Simulates a user who hasn't been active recently

DO $$
DECLARE
  test_user_id UUID := '8678d249-9ea9-46d4-ab9a-9ffa91d99677'; -- REPLACE THIS WITH YOUR USER ID
BEGIN
  -- Clear previous data
  DELETE FROM public.quest_attempts WHERE user_id = test_user_id;
  DELETE FROM public.user_course_progress WHERE user_id = test_user_id;

  -- Insert old attempts (15+ days ago to trigger drop-risk)
  INSERT INTO public.quest_attempts (user_id, quest_id, started_at, completed_at, score, completion_time, status)
  VALUES
    (test_user_id, 'quest-1', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days', 75, 300, 'completed'),
    (test_user_id, 'quest-2', NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days', 80, 280, 'completed'),
    (test_user_id, 'quest-3', NOW() - INTERVAL '16 days', NOW() - INTERVAL '16 days', 70, 320, 'completed');

  -- Update user_course_progress
  INSERT INTO public.user_course_progress (user_id, course_id, module_id, lesson_id, completed_at, quiz_score)
  VALUES
    (test_user_id, 'quest-1', 1, 1, NOW() - INTERVAL '20 days', 75),
    (test_user_id, 'quest-2', 1, 2, NOW() - INTERVAL '18 days', 80),
    (test_user_id, 'quest-3', 1, 3, NOW() - INTERVAL '16 days', 70)
  ON CONFLICT (user_id, course_id, module_id, lesson_id) DO UPDATE
    SET quiz_score = EXCLUDED.quiz_score,
        completed_at = EXCLUDED.completed_at;

  -- Update user_progress (for Dashboard checkboxes)
  INSERT INTO public.user_progress (user_id, quest_id, completed, score, xp_earned, attempts, completed_at)
  VALUES
    (test_user_id, 'quest-1', true, 75, 100, 1, NOW() - INTERVAL '20 days'),
    (test_user_id, 'quest-2', true, 80, 150, 1, NOW() - INTERVAL '18 days'),
    (test_user_id, 'quest-3', true, 70, 200, 1, NOW() - INTERVAL '16 days')
  ON CONFLICT (user_id, quest_id) DO UPDATE
    SET score = EXCLUDED.score,
        completed_at = EXCLUDED.completed_at;

  RAISE NOTICE 'DROP_RISK learner data created successfully';
END $$;

-- ============================================
-- SCENARIO 4: CONSISTENT LEARNER
-- ============================================
-- Simulates a user with steady, average progress

DO $$
DECLARE
  test_user_id UUID := 'b048c14f-669a-4c85-bacb-67344f468994'; -- REPLACE THIS WITH YOUR USER ID
BEGIN
  -- Clear previous data
  DELETE FROM public.quest_attempts WHERE user_id = test_user_id;
  DELETE FROM public.user_course_progress WHERE user_id = test_user_id;

  -- Insert consistent attempts with average scores
  INSERT INTO public.quest_attempts (user_id, quest_id, started_at, completed_at, score, completion_time, status)
  VALUES
    (test_user_id, 'quest-1', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days', 72, 250, 'completed'),
    (test_user_id, 'quest-2', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', 68, 270, 'completed'),
    (test_user_id, 'quest-3', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days', 75, 240, 'completed'),
    (test_user_id, 'quest-4', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', 70, 260, 'completed'),
    (test_user_id, 'quest-5', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', 73, 255, 'completed');

  -- Update user_course_progress
  INSERT INTO public.user_course_progress (user_id, course_id, module_id, lesson_id, completed_at, quiz_score)
  VALUES
    (test_user_id, 'quest-1', 1, 1, NOW() - INTERVAL '6 days', 72),
    (test_user_id, 'quest-2', 1, 2, NOW() - INTERVAL '5 days', 68),
    (test_user_id, 'quest-3', 1, 3, NOW() - INTERVAL '4 days', 75),
    (test_user_id, 'quest-4', 1, 4, NOW() - INTERVAL '3 days', 70),
    (test_user_id, 'quest-5', 1, 5, NOW() - INTERVAL '2 days', 73)
  ON CONFLICT (user_id, course_id, module_id, lesson_id) DO UPDATE
    SET quiz_score = EXCLUDED.quiz_score,
        completed_at = EXCLUDED.completed_at;

  -- Update user_progress (for Dashboard checkboxes)
  INSERT INTO public.user_progress (user_id, quest_id, completed, score, xp_earned, attempts, completed_at)
  VALUES
    (test_user_id, 'quest-1', true, 72, 100, 1, NOW() - INTERVAL '6 days'),
    (test_user_id, 'quest-2', true, 68, 150, 1, NOW() - INTERVAL '5 days'),
    (test_user_id, 'quest-3', true, 75, 200, 1, NOW() - INTERVAL '4 days'),
    (test_user_id, 'quest-4', true, 70, 250, 1, NOW() - INTERVAL '3 days'),
    (test_user_id, 'quest-5', true, 73, 120, 1, NOW() - INTERVAL '2 days')
  ON CONFLICT (user_id, quest_id) DO UPDATE
    SET score = EXCLUDED.score,
        completed_at = EXCLUDED.completed_at;

  -- Update profile
  UPDATE public.profiles
  SET xp = 358, total_xp = 358, completed_quests = 5
  WHERE id = test_user_id;

  RAISE NOTICE 'CONSISTENT learner data created successfully';
END $$;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify the data was created correctly

-- Check quest attempts
SELECT 
  quest_id,
  score,
  completion_time,
  completed_at,
  status
FROM public.quest_attempts
WHERE user_id = 'YOUR_USER_ID_HERE'
ORDER BY completed_at DESC;

-- Check calculated metrics
SELECT 
  COUNT(*) as total_attempts,
  AVG(score) as avg_score,
  AVG(completion_time) as avg_time,
  MAX(completed_at) as last_active
FROM public.quest_attempts
WHERE user_id = 'YOUR_USER_ID_HERE'
  AND status = 'completed'
  AND completed_at > NOW() - INTERVAL '30 days';
