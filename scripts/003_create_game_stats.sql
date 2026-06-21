-- Game stats per user per game type
create table if not exists public.game_stats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  game_type text not null,
  wins integer default 0,
  losses integer default 0,
  draws integer default 0,
  high_score integer default 0,
  games_played integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, game_type)
);

alter table public.game_stats enable row level security;

-- Anyone can read stats (leaderboards)
create policy "game_stats_select_all" on public.game_stats for select using (true);
-- Users can insert their own stats
create policy "game_stats_insert_own" on public.game_stats for insert with check (auth.uid() = user_id);
-- Users can update their own stats
create policy "game_stats_update_own" on public.game_stats for update using (auth.uid() = user_id);
