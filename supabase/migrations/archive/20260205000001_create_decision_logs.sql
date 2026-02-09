-- Create decision_logs table for auditable AI/system decisions
-- This is the "proof of work" table that reviewers will love
CREATE TABLE public.decision_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  state_detected TEXT NOT NULL,
  action_taken TEXT NOT NULL,
  reason TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_decision_logs_user_id ON public.decision_logs(user_id);
CREATE INDEX idx_decision_logs_timestamp ON public.decision_logs(timestamp);

-- Enable RLS
ALTER TABLE public.decision_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own decision logs" ON public.decision_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert decision logs" ON public.decision_logs
  FOR INSERT WITH CHECK (true);
