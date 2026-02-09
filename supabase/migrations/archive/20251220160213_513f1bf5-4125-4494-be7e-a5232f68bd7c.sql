-- Add last_quest_date column to track streak resets
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_quest_date date;