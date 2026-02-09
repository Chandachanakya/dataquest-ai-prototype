CREATE TABLE public.user_course_progress (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    course_id VARCHAR(255) NOT NULL,
    module_id INT NOT NULL,
    lesson_id INT NOT NULL,
    completed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    quiz_score INT, -- Nullable, as not all lessons may have quizzes

    UNIQUE (user_id, course_id, module_id, lesson_id)
);

-- Indexes to speed up queries
CREATE INDEX idx_user_course_progress_user_id ON public.user_course_progress(user_id);
CREATE INDEX idx_user_course_progress_course_id ON public.user_course_progress(course_id);

-- Enable Row-Level Security
ALTER TABLE public.user_course_progress ENABLE ROW LEVEL SECURITY;

-- Policies for RLS
-- Users can view their own progress
CREATE POLICY "Allow users to view their own progress" 
ON public.user_course_progress 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own progress
CREATE POLICY "Allow users to insert their own progress" 
ON public.user_course_progress 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own progress (e.g., quiz scores)
CREATE POLICY "Allow users to update their own progress" 
ON public.user_course_progress 
FOR UPDATE 
USING (auth.uid() = user_id);
