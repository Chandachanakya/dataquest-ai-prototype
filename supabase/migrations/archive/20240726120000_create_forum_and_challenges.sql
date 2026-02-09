
      -- FORUM TABLES
      create table forum_posts (
        id uuid primary key default gen_random_uuid(),
        user_id uuid not null,
        username text not null,
        avatar text,
        title text not null,
        content text not null,
        topic text not null,
        likes int default 0,
        created_at timestamptz default now()
      );

      create table forum_replies (
        id uuid primary key default gen_random_uuid(),
        post_id uuid not null references forum_posts(id) on delete cascade,
        user_id uuid not null,
        username text not null,
        avatar text,
        content text not null,
        likes int default 0,
        created_at timestamptz default now()
      );

      -- Enable RLS
      alter table forum_posts enable row level security;
      alter table forum_replies enable row level security;

      -- RLS POLICIES for forum_posts
      create policy "All users can view posts."
        on forum_posts for select using (true);

      create policy "Users can insert their own forum posts."
        on forum_posts for insert with check (auth.uid() = user_id);

      create policy "Users can update their own forum posts."
        on forum_posts for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

      create policy "Users can delete their own forum posts."
        on forum_posts for delete using (auth.uid() = user_id);

      -- RLS POLICIES for forum_replies
      create policy "All users can view replies."
        on forum_replies for select using (true);

      create policy "Users can insert their own replies."
        on forum_replies for insert with check (auth.uid() = user_id);

      create policy "Users can update their own replies."
        on forum_replies for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

      create policy "Users can delete their own replies."
        on forum_replies for delete using (auth.uid() = user_id);


      -- CHALLENGE TABLES
      CREATE TABLE public.challenges (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        quest_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        target_score INT NOT NULL,
        creator_id UUID NOT NULL,
        creator_name TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE public.challenge_participants (
        challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
        user_id UUID NOT NULL,
        username TEXT NOT NULL,
        avatar TEXT,
        score INT,
        completed_at TIMESTAMP WITH TIME ZONE,
        PRIMARY KEY (challenge_id, user_id)
      );
      
      -- Enable RLS for Challenge Tables
      ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;
      
      -- RLS Policies for challenges
      CREATE POLICY "Anyone can view challenges" ON public.challenges FOR SELECT USING (true);
      CREATE POLICY "Users can create challenges" ON public.challenges FOR INSERT WITH CHECK (auth.uid() = creator_id);
      
      -- RLS Policies for challenge_participants
      CREATE POLICY "Anyone can view participants" ON public.challenge_participants FOR SELECT USING (true);
      CREATE POLICY "Users can join challenges" ON public.challenge_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
      CREATE POLICY "Users can update their own progress" ON public.challenge_participants FOR UPDATE USING (auth.uid() = user_id);
      