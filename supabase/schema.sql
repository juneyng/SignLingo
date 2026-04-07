-- SignLingo Supabase Database Schema
-- Run this in Supabase SQL Editor to set up the database

-- Profiles (extends Supabase auth.users)
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

-- Signs (reference sign data)
create table signs (
  id text primary key,
  name_ko text not null,
  name_en text not null,
  category text not null,
  type text not null default 'static' check (type in ('static', 'dynamic')),
  difficulty int not null default 1,
  landmarks jsonb,           -- for static signs: [[x, y, z], ...]
  landmark_sequence jsonb,   -- for dynamic signs: array of frames
  video_url text,
  description text,
  tips text
);

-- Lessons
create table lessons (
  id serial primary key,
  category text not null,
  title text not null,
  title_ko text not null,
  description text,
  "order" int default 0
);

-- Lesson-Sign mapping (which signs belong to which lesson)
create table lesson_signs (
  lesson_id int references lessons(id) on delete cascade,
  sign_id text references signs(id) on delete cascade,
  "order" int default 0,
  primary key (lesson_id, sign_id)
);

-- User progress
create table user_progress (
  user_id uuid references auth.users on delete cascade primary key,
  streak int default 0,
  total_points int default 0,
  achievements text[] default '{}',
  last_active_date date default current_date
);

-- Completed signs (per user)
create table completed_signs (
  user_id uuid references auth.users on delete cascade,
  sign_id text references signs(id) on delete cascade,
  best_score int default 0,
  completed_at timestamptz default now(),
  primary key (user_id, sign_id)
);

-- Daily missions
create table daily_missions (
  user_id uuid references auth.users on delete cascade,
  date date default current_date,
  completed int default 0,
  target int default 3,
  primary key (user_id, date)
);

-- RPC: Add points to user
create or replace function add_points(p_user_id uuid, p_points int)
returns void as $$
begin
  insert into user_progress (user_id, total_points)
  values (p_user_id, p_points)
  on conflict (user_id)
  do update set total_points = user_progress.total_points + p_points;
end;
$$ language plpgsql security definer;

-- Row Level Security
alter table profiles enable row level security;
alter table signs enable row level security;
alter table lessons enable row level security;
alter table lesson_signs enable row level security;
alter table user_progress enable row level security;
alter table completed_signs enable row level security;
alter table daily_missions enable row level security;

-- Policies: signs and lessons are readable by everyone
create policy "Signs are viewable by everyone" on signs for select using (true);
create policy "Lessons are viewable by everyone" on lessons for select using (true);
create policy "Lesson signs are viewable by everyone" on lesson_signs for select using (true);

-- Policies: users can read/write their own data
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

create policy "Users can view own progress" on user_progress for select using (auth.uid() = user_id);
create policy "Users can insert own progress" on user_progress for insert with check (auth.uid() = user_id);
create policy "Users can update own progress" on user_progress for update using (auth.uid() = user_id);

create policy "Users can view own completed signs" on completed_signs for select using (auth.uid() = user_id);
create policy "Users can insert own completed signs" on completed_signs for insert with check (auth.uid() = user_id);
create policy "Users can update own completed signs" on completed_signs for update using (auth.uid() = user_id);

create policy "Users can view own daily missions" on daily_missions for select using (auth.uid() = user_id);
create policy "Users can insert own daily missions" on daily_missions for insert with check (auth.uid() = user_id);
create policy "Users can update own daily missions" on daily_missions for update using (auth.uid() = user_id);

-- Leaderboard: everyone can see total_points
create policy "Leaderboard is viewable by everyone" on user_progress for select using (true);

-- Seed data: sample signs
insert into signs (id, name_ko, name_en, category, type, difficulty, landmarks, description, tips) values
('giyeok_001', 'ㄱ', 'Giyeok', 'fingerspelling', 'static', 1,
 '[[0,0,0],[0.2,-0.1,-0.05],[0.4,-0.15,-0.08],[0.5,-0.1,-0.06],[0.55,-0.05,-0.04],[0.3,-0.6,-0.02],[0.35,-0.9,-0.03],[0.3,-1.0,-0.02],[0.25,-1.05,-0.01],[0.1,-0.6,-0.01],[0.1,-0.5,0],[0.1,-0.4,0.01],[0.1,-0.35,0.02],[-0.1,-0.55,0],[-0.1,-0.45,0.01],[-0.1,-0.38,0.02],[-0.1,-0.33,0.03],[-0.25,-0.45,0.02],[-0.25,-0.38,0.03],[-0.25,-0.32,0.04],[-0.25,-0.28,0.05]]',
 'Index finger extended, bent at second joint like the shape of ㄱ',
 'Extend your index finger and bend it at the second joint. Keep other fingers curled.'),
('nieun_001', 'ㄴ', 'Nieun', 'fingerspelling', 'static', 1,
 '[[0,0,0],[0.2,-0.1,-0.05],[0.35,-0.05,-0.08],[0.45,0,-0.06],[0.5,0.05,-0.04],[0.3,-0.6,-0.02],[0.3,-0.85,-0.03],[0.25,-0.95,-0.02],[0.2,-1.0,-0.01],[0.1,-0.6,-0.01],[0.1,-0.5,0],[0.1,-0.4,0.01],[0.1,-0.35,0.02],[-0.1,-0.55,0],[-0.1,-0.45,0.01],[-0.1,-0.38,0.02],[-0.1,-0.33,0.03],[-0.25,-0.45,0.02],[-0.25,-0.38,0.03],[-0.25,-0.32,0.04],[-0.25,-0.28,0.05]]',
 'Thumb extended to the side, index finger pointing down, forming ㄴ shape',
 'Point your index finger down and extend your thumb to the right to form an L-shape (ㄴ).'),
('digeut_001', 'ㄷ', 'Digeut', 'fingerspelling', 'static', 1,
 '[[0,0,0],[0.2,-0.1,-0.05],[0.35,-0.15,-0.08],[0.45,-0.1,-0.06],[0.5,-0.05,-0.04],[0.3,-0.6,-0.02],[0.35,-0.85,-0.03],[0.35,-0.95,-0.02],[0.35,-1.0,-0.01],[0.1,-0.6,-0.01],[0.1,-0.85,0],[0.1,-0.95,0.01],[0.1,-1.0,0.02],[-0.1,-0.55,0],[-0.1,-0.45,0.01],[-0.1,-0.38,0.02],[-0.1,-0.33,0.03],[-0.25,-0.45,0.02],[-0.25,-0.38,0.03],[-0.25,-0.32,0.04],[-0.25,-0.28,0.05]]',
 'Index and middle fingers extended and parallel, forming ㄷ shape',
 'Extend your index and middle fingers straight, keeping them together side by side.');

-- Seed data: sample lessons
insert into lessons (category, title, title_ko, description, "order") values
('fingerspelling', 'Korean Consonants 1', '한글 자음 1', 'Learn ㄱ, ㄴ, ㄷ fingerspelling', 1);

insert into lesson_signs (lesson_id, sign_id, "order") values
(1, 'giyeok_001', 1),
(1, 'nieun_001', 2),
(1, 'digeut_001', 3);
