-- ============================================================
-- Net Movies – Supabase schema
-- Run this in: Supabase Dashboard > SQL Editor
-- ============================================================

-- ── Bookmarks ────────────────────────────────────────────────
create table if not exists public.bookmarks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  movie_id    integer not null,
  title       text not null,
  poster_path text,
  vote_average numeric(4, 2),
  release_date text,
  created_at  timestamptz default now()
);

-- Each user can only bookmark a movie once
create unique index if not exists bookmarks_user_movie_idx
  on public.bookmarks (user_id, movie_id);

-- ── Row-Level Security ───────────────────────────────────────
alter table public.bookmarks enable row level security;

-- Authenticated users can only read their own bookmarks
create policy "Users can view own bookmarks"
  on public.bookmarks for select
  using (auth.uid() = user_id);

-- Authenticated users can insert their own bookmarks
create policy "Users can insert own bookmarks"
  on public.bookmarks for insert
  with check (auth.uid() = user_id);

-- Authenticated users can delete their own bookmarks
create policy "Users can delete own bookmarks"
  on public.bookmarks for delete
  using (auth.uid() = user_id);

-- ── Profiles (optional public display name / avatar) ─────────
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  username     text unique,
  avatar_url   text,
  updated_at   timestamptz
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create a profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Avatar Storage ───────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Avatar images are viewable by everyone"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can upload own avatar images"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update own avatar images"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete own avatar images"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ── Search Tracking ──────────────────────────────────────────
create table if not exists public.searches (
  id          uuid primary key default gen_random_uuid(),
  query       text not null,
  count       integer not null default 1,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  constraint searches_query_key unique (query)
);

alter table public.searches enable row level security;

-- Anyone can read search counts (e.g. for trending searches)
create policy "Anyone can view searches"
  on public.searches for select using (true);

-- Allow inserts for new queries
create policy "Anyone can insert searches"
  on public.searches for insert with check (true);

-- Allow updating the count on existing queries
create policy "Anyone can update search count"
  on public.searches for update using (true);

-- Upsert a search query: insert on first use, increment count on repeat
create or replace function public.upsert_search(search_query text)
returns void language plpgsql security definer as $$
begin
  insert into public.searches (query, count)
  values (lower(trim(search_query)), 1)
  on conflict (query)
  do update set
    count      = searches.count + 1,
    updated_at = now();
end;
$$;
