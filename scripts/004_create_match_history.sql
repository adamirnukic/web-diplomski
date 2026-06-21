-- Match history table
create table if not exists public.match_history (
  id uuid primary key default gen_random_uuid(),
  game_type text not null,
  player1_id uuid references public.profiles(id) on delete set null,
  player2_id uuid references public.profiles(id) on delete set null,
  winner_id uuid references public.profiles(id) on delete set null,
  is_draw boolean default false,
  score_data jsonb default '{}',
  played_at timestamptz default now()
);

alter table public.match_history enable row level security;

-- Anyone can read match history
create policy "match_history_select_all" on public.match_history for select using (true);
-- Authenticated users can insert match history
create policy "match_history_insert_auth" on public.match_history for insert with check (auth.uid() = player1_id or auth.uid() = player2_id);
