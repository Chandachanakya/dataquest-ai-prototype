-- Create quests table to support learner analytics
-- This table stores quest metadata that was previously only in JSON files

CREATE TABLE public.quests (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  topic TEXT NOT NULL,
  xp INTEGER NOT NULL DEFAULT 100,
  type TEXT NOT NULL CHECK (type IN ('quiz', 'code', 'game')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for common queries
CREATE INDEX idx_quests_difficulty ON public.quests(difficulty);
CREATE INDEX idx_quests_topic ON public.quests(topic);
CREATE INDEX idx_quests_type ON public.quests(type);

-- Enable RLS
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read quests (they're public data)
CREATE POLICY "Anyone can view quests" ON public.quests
  FOR SELECT USING (true);

-- Only service role can manage quests
CREATE POLICY "Service role can manage quests" ON public.quests
  FOR ALL USING (auth.role() = 'service_role');

-- Seed initial quest data from the application
INSERT INTO public.quests (id, title, description, difficulty, topic, xp, type) VALUES
  ('quest-1', 'Python for Data Science Init', 'Master the foundational Python concepts essential for data analysis', 'beginner', 'python', 100, 'quiz'),
  ('quest-2', 'NumPy Ninja', 'Understand arrays and vectorization with NumPy', 'beginner', 'numpy', 150, 'code'),
  ('quest-3', 'Pandas Power', 'Data manipulation and analysis with Pandas DataFrames', 'intermediate', 'pandas', 200, 'quiz'),
  ('quest-4', 'Data Cleaning Challenge', 'Handle missing values and duplicates effectively', 'intermediate', 'data-cleaning', 250, 'code'),
  ('quest-5', 'Visualization Voyager', 'Principles of data visualization with Matplotlib and Seaborn', 'beginner', 'visualization', 120, 'quiz'),
  ('quest-6', 'Machine Learning Concept Check', 'Test your knowledge of core ML concepts', 'advanced', 'machine-learning', 300, 'quiz'),
  ('quest-7', 'Introduction to SQL for Data', 'Querying databases for analysis', 'beginner', 'sql', 100, 'quiz'),
  ('quest-8', 'Linear Regression Logic', 'Understand the math behind the line of best fit', 'advanced', 'machine-learning', 250, 'code');

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_quests_updated_at
  BEFORE UPDATE ON public.quests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

COMMENT ON TABLE public.quests IS 'Stores quest metadata for the learning platform';
