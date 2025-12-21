-- This is a dummy migration to trigger a schema reload in Supabase.
COMMENT ON TABLE public.forum_posts IS 'Forum posts table';
COMMENT ON TABLE public.forum_replies IS 'Replies to forum posts';
COMMENT ON TABLE public.challenges IS 'User-created challenges';
COMMENT ON TABLE public.challenge_participants IS 'Participants in challenges';
