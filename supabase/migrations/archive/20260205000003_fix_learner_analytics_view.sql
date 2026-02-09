-- Fix the learner_analytics view to properly reference the quests table
-- This migration updates the view created in 20260108120000_create_learner_decision_layer.sql

-- Drop the existing view
DROP VIEW IF EXISTS public.learner_analytics;

-- Recreate the view with proper table references
CREATE OR REPLACE VIEW public.learner_analytics AS
SELECT 
  p.id AS user_id,
  
  -- Engagement & Activity Metrics
  MAX(up.completed_at) AS last_active_at,
  COUNT(DISTINCT DATE(up.completed_at)) FILTER (WHERE up.completed_at > NOW() - INTERVAL '30 days') AS activity_frequency, -- Unique active days in last 30 days
  
  -- Performance Metrics
  AVG(up.quiz_score) FILTER (WHERE up.quiz_score IS NOT NULL AND up.completed_at > NOW() - INTERVAL '30 days') AS average_score, -- Avg score in last 30 days (0-100 scale)
  COUNT(up.id) FILTER (WHERE up.completed_at > NOW() - INTERVAL '30 days') AS total_attempts, -- Count of lesson/quiz attempts
  
  -- Progress Metrics - Use XP from quests table
  SUM(q.xp) FILTER (WHERE up.completed = TRUE AND up.completed_at > NOW() - INTERVAL '7 days') AS weekly_xp_earned -- XP earned in the last week

FROM 
  public.profiles p
LEFT JOIN 
  public.user_course_progress up ON p.id = up.user_id
LEFT JOIN
  public.quests q ON up.course_id = q.id  -- Join with quests table using course_id as quest_id
GROUP BY 
  p.id;

COMMENT ON VIEW public.learner_analytics IS 'Aggregates user activity data for learner state evaluation';
