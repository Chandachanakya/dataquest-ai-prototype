-- Create quest_attempts table for event-driven analytics
-- This table tracks EVERY attempt, not just the best score
CREATE TABLE public.quest_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quest_id TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  score INTEGER,
  completion_time INTEGER, -- in seconds
  status TEXT NOT NULL DEFAULT 'started' CHECK (status IN ('started', 'completed', 'abandoned')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_quest_attempts_user_id ON public.quest_attempts(user_id);
CREATE INDEX idx_quest_attempts_quest_id ON public.quest_attempts(quest_id);
CREATE INDEX idx_quest_attempts_started_at ON public.quest_attempts(started_at);

-- Enable RLS
ALTER TABLE public.quest_attempts ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own attempts" ON public.quest_attempts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own attempts" ON public.quest_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own attempts" ON public.quest_attempts
  FOR UPDATE USING (auth.uid() = user_id);
