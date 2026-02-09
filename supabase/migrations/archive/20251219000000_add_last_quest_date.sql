-- Add last_quest_date column to track when user last completed a quest
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS last_quest_date DATE;

-- Update existing records to set last_quest_date based on their most recent quest completion
UPDATE public.profiles p
SET last_quest_date = (
  SELECT DATE(MAX(up.completed_at))
  FROM public.user_progress up
  WHERE up.user_id = p.id AND up.completed = true
)
WHERE last_quest_date IS NULL;



