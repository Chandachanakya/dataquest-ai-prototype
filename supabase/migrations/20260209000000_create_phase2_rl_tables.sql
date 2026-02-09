-- Phase 2: Reinforcement Learning Tables
-- These tables support RL-based quest sequencing, intervention experiments, and adaptive difficulty

-- Quest Sequences: Track recommended quests and their Q-values
CREATE TABLE IF NOT EXISTS public.quest_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quest_id TEXT NOT NULL,
  q_value FLOAT NOT NULL,
  selected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed BOOLEAN DEFAULT FALSE,
  actual_reward FLOAT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_quest_sequences_user_id ON public.quest_sequences(user_id);
CREATE INDEX idx_quest_sequences_selected_at ON public.quest_sequences(selected_at);

-- Enable RLS
ALTER TABLE public.quest_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sequences" ON public.quest_sequences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sequences" ON public.quest_sequences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sequences" ON public.quest_sequences
  FOR UPDATE USING (auth.uid() = user_id);

-- Intervention Experiments: Track multi-armed bandit experiments
CREATE TABLE IF NOT EXISTS public.intervention_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  intervention_type TEXT NOT NULL CHECK (intervention_type IN ('encouragement', 'hint', 'easier_quest', 'break')),
  learner_state TEXT,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  success BOOLEAN,
  measured_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_intervention_experiments_user_id ON public.intervention_experiments(user_id);
CREATE INDEX idx_intervention_experiments_applied_at ON public.intervention_experiments(applied_at);

-- Enable RLS
ALTER TABLE public.intervention_experiments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own experiments" ON public.intervention_experiments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own experiments" ON public.intervention_experiments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own experiments" ON public.intervention_experiments
  FOR UPDATE USING (auth.uid() = user_id);

-- Difficulty Adjustments: Track adaptive difficulty changes
CREATE TABLE IF NOT EXISTS public.difficulty_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  from_difficulty TEXT,
  to_difficulty TEXT NOT NULL CHECK (to_difficulty IN ('beginner', 'intermediate', 'advanced')),
  reason TEXT,
  adjusted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  performance_metrics JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_difficulty_adjustments_user_id ON public.difficulty_adjustments(user_id);
CREATE INDEX idx_difficulty_adjustments_adjusted_at ON public.difficulty_adjustments(adjusted_at);

-- Enable RLS
ALTER TABLE public.difficulty_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own adjustments" ON public.difficulty_adjustments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own adjustments" ON public.difficulty_adjustments
  FOR INSERT WITH CHECK (auth.uid() = user_id);
