-- SignLingo Supabase Database Schema (Option A: shared recordings)
-- Run this in Supabase SQL Editor to set up the database.

-- ============================================================
-- 1. PROFILES — extends Supabase auth.users
-- ============================================================
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  email text,
  created_at timestamptz default now()
);

-- Auto-create profile on user signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, display_name, email)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- 2. SIGN RECORDINGS — shared reference data uploaded via /record
-- ============================================================
-- Option A: one recording per sign_id, shared across all users.
-- Later uploads overwrite earlier ones (upsert).

create table sign_recordings (
  sign_id text primary key,
  sequence jsonb not null,                -- DTW feature vectors (array of 84-dim frames)
  landmarks jsonb,                        -- representative static hand landmarks
  pose_landmarks jsonb,                   -- arm/body landmarks
  ref_hand_position jsonb,                -- hand position metadata
  video_url text,                         -- Supabase Storage public URL
  total_frames int,
  duration real,
  detection_rate int,
  uploaded_by uuid references auth.users on delete set null,
  uploaded_at timestamptz default now()
);

-- ============================================================
-- 3. USER PROGRESS (optional, for future use)
-- ============================================================
create table user_progress (
  user_id uuid references auth.users on delete cascade primary key,
  streak int default 0,
  total_points int default 0,
  completed_signs text[] default '{}',
  last_active_date date default current_date
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table profiles enable row level security;
alter table sign_recordings enable row level security;
alter table user_progress enable row level security;

-- Profiles — users see/update own
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Sign recordings — everyone can read, anyone can write (Option A: open recording)
create policy "Recordings are viewable by everyone" on sign_recordings for select using (true);
create policy "Anyone can insert recordings" on sign_recordings for insert with check (true);
create policy "Anyone can update recordings" on sign_recordings for update using (true);

-- User progress — users see/write own
create policy "Users can view own progress" on user_progress for select using (auth.uid() = user_id);
create policy "Users can insert own progress" on user_progress for insert with check (auth.uid() = user_id);
create policy "Users can update own progress" on user_progress for update using (auth.uid() = user_id);

-- ============================================================
-- STORAGE BUCKET for sign videos
-- ============================================================
-- Create a public bucket for video files.
-- Run this after tables are set up.

insert into storage.buckets (id, name, public)
values ('sign-videos', 'sign-videos', true)
on conflict (id) do nothing;

-- Storage policies: public read, open write (Option A)
create policy "Videos are publicly readable"
  on storage.objects for select
  using (bucket_id = 'sign-videos');

create policy "Anyone can upload sign videos"
  on storage.objects for insert
  with check (bucket_id = 'sign-videos');

create policy "Anyone can update sign videos"
  on storage.objects for update
  using (bucket_id = 'sign-videos');
