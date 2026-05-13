-- ============================================================
-- SignLingo: Fix auth trigger ("Database error saving new user")
-- ============================================================
-- Run this in Supabase SQL Editor whenever the OAuth callback fails
-- with `error_description=Database+error+saving+new+user`.
--
-- Root causes addressed:
--   1. profiles table missing -> create if absent
--   2. handle_new_user() function lacks schema-qualified names + search_path
--   3. RLS blocks INSERT from trigger (safety net policy added)
-- ============================================================

-- 1. Ensure profiles table exists
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  email text,
  created_at timestamptz default now()
);

-- 2. Recreate the trigger function with schema-qualified names + search_path
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- 3. Recreate the trigger (drop first to avoid duplication)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. Ensure RLS is on, but allow trigger-driven INSERT (safety net)
alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "Allow profile creation on signup" on public.profiles;
create policy "Allow profile creation on signup" on public.profiles
  for insert with check (true);

-- 5. Backfill: create profile rows for any auth.users that already exist
insert into public.profiles (id, display_name, email)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', ''),
  u.email
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;
