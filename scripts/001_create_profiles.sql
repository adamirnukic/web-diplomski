-- Create profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  avatar_url text,
  bio text default '',
  level integer default 1,
  xp integer default 0,
  total_games_played integer default 0,
  total_wins integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- Anyone can read profiles (for leaderboards, public profiles)
create policy "profiles_select_all" on public.profiles for select using (true);
-- Users can only insert/update their own profile
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
