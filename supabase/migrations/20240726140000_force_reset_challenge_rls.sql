
-- Force disable and re-enable RLS on challenge tables to clear any bad state.
ALTER TABLE public.challenges DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participants DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to ensure a clean slate
DROP POLICY IF EXISTS "Anyone can view challenges" ON public.challenges;
DROP POLICY IF EXISTS "Users can create challenges" ON public.challenges;
DROP POLICY IF EXISTS "Anyone can view participants" ON public.challenge_participants;
DROP POLICY IF EXISTS "Users can join challenges" ON public.challenge_participants;
DROP POLICY IF EXISTS "Users can update their own progress" ON public.challenge_participants;

-- Re-enable RLS
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;

-- Recreate RLS Policies for challenges
CREATE POLICY "Anyone can view challenges" ON public.challenges FOR SELECT USING (true);
CREATE POLICY "Users can create challenges" ON public.challenges FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- Recreate RLS Policies for challenge_participants
CREATE POLICY "Anyone can view participants" ON public.challenge_participants FOR SELECT USING (true);
CREATE POLICY "Users can join challenges" ON public.challenge_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own progress" ON public.challenge_participants FOR UPDATE USING (auth.uid() = user_id);
