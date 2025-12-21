-- Create forum_posts table
create table forum_posts (
  id uuid not null primary key default gen_random_uuid(),
  user_id uuid references public.profiles not null,
  username text not null,
  avatar text,
  title text not null check (char_length(trim(title)) > 5),
  content text not null check (char_length(trim(content)) > 10),
  topic text not null check (char_length(trim(topic)) > 3),
  likes integer default 0,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table forum_posts enable row level security;

-- Policies for forum_posts
create policy "Forum posts are viewable by everyone."
  on forum_posts for select using (true);

create policy "Users can insert their own forum posts."
  on forum_posts for insert with check (auth.uid() = user_id);

create policy "Users can update their own forum posts."
  on forum_posts for update using (auth.uid() = user_id);

create policy "Users can delete their own forum posts."
  on forum_posts for delete using (auth.uid() = user_id);

-- Create forum_replies table
create table forum_replies (
  id uuid not null primary key default gen_random_uuid(),
  post_id uuid references forum_posts on delete cascade not null,
  user_id uuid references public.profiles not null,
  username text not null,
  avatar text,
  content text not null check (char_length(trim(content)) > 0),
  likes integer default 0,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table forum_replies enable row level security;

-- Policies for forum_replies
create policy "Forum replies are viewable by everyone."
  on forum_replies for select using (true);

create policy "Users can insert their own forum replies."
  on forum_replies for insert with check (auth.uid() = user_id);

create policy "Users can update their own forum replies."
  on forum_replies for update using (auth.uid() = user_id);

create policy "Users can delete their own forum replies."
  on forum_replies for delete using (auth.uid() = user_id);


-- Create challenges table
create table challenges (
  id uuid not null primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) > 10),
  description text,
  quest_id text not null,
  creator_id uuid references public.profiles not null,
  creator_name text not null,
  target_score integer not null check (target_score > 0),
  expires_at timestamp with time zone not null check (expires_at > now()),
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table challenges enable row level security;

-- Policies for challenges
create policy "Challenges are viewable by everyone."
  on challenges for select using (true);

create policy "Users can insert their own challenges."
  on challenges for insert with check (auth.uid() = creator_id);

create policy "Users can update their own challenges."
  on challenges for update using (auth.uid() = creator_id);

create policy "Users can delete their own challenges."
  on challenges for delete using (auth.uid() = creator_id);


-- Create challenge_participants table
create table challenge_participants (
  challenge_id uuid references challenges on delete cascade not null,
  user_id uuid references public.profiles not null,
  username text not null,
  avatar text,
  score integer,
  completed_at timestamp with time zone,
  primary key (challenge_id, user_id)
);

-- Enable RLS
alter table challenge_participants enable row level security;

-- Policies for challenge_participants
create policy "Challenge participants are viewable by everyone."
  on challenge_participants for select using (true);

create policy "Users can insert themselves as participants."
  on challenge_participants for insert with check (auth.uid() = user_id);

create policy "Users can update their own participant entry."
  on challenge_participants for update using (auth.uid() = user_id);

create policy "Users can delete their own participant entry."
  on challenge_participants for delete using (auth.uid() = user_id);