-- ============================================================
-- SignLingo: Add gamification columns to user_progress
-- ============================================================
-- Run this in Supabase SQL Editor.
-- Adds XP, stars, hearts, daily XP cap, and streak metadata.
-- Existing rows get sensible defaults.
-- ============================================================

alter table public.user_progress
  add column if not exists xp                int          not null default 0,
  add column if not exists stars             int          not null default 0,
  add column if not exists hearts            int          not null default 5,
  add column if not exists hearts_updated_at timestamptz  not null default now(),
  add column if not exists daily_xp          int          not null default 0,
  add column if not exists daily_xp_date     date         not null default current_date,
  add column if not exists last_login_date   date;

-- ============================================================
-- Helper RPC: ensure_progress_row
-- Called by the client on first sign-in. Creates a user_progress row
-- if missing. Safe to call repeatedly (no-op when row exists).
-- ============================================================
create or replace function public.ensure_progress_row(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_progress (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;
end;
$$;

-- ============================================================
-- Helper RPC: touch_streak
-- Called on app entry. Updates streak based on last_login_date:
--   - same day        : no change
--   - yesterday       : streak += 1
--   - older / null    : streak = 1 (reset)
-- Returns the updated row.
-- ============================================================
create or replace function public.touch_streak(p_user_id uuid)
returns public.user_progress
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.user_progress;
  v_today date := current_date;
begin
  perform public.ensure_progress_row(p_user_id);

  select * into v_row from public.user_progress where user_id = p_user_id;

  if v_row.last_login_date = v_today then
    -- already logged in today; no streak change
    return v_row;
  elsif v_row.last_login_date = v_today - interval '1 day' then
    update public.user_progress
       set streak = streak + 1,
           last_login_date = v_today
     where user_id = p_user_id
     returning * into v_row;
  else
    update public.user_progress
       set streak = 1,
           last_login_date = v_today
     where user_id = p_user_id
     returning * into v_row;
  end if;

  return v_row;
end;
$$;

-- ============================================================
-- Helper RPC: refill_hearts
-- Computes natural heart recovery: +1 heart per 20 minutes elapsed
-- since hearts_updated_at, capped at 5. Updates the row in place.
-- ============================================================
create or replace function public.refill_hearts(p_user_id uuid)
returns public.user_progress
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.user_progress;
  v_elapsed_min int;
  v_recovered int;
  v_new_hearts int;
begin
  select * into v_row from public.user_progress where user_id = p_user_id;
  if v_row is null then
    perform public.ensure_progress_row(p_user_id);
    select * into v_row from public.user_progress where user_id = p_user_id;
  end if;

  if v_row.hearts >= 5 then
    return v_row;
  end if;

  v_elapsed_min := floor(extract(epoch from (now() - v_row.hearts_updated_at)) / 60);
  v_recovered  := floor(v_elapsed_min / 20);

  if v_recovered <= 0 then
    return v_row;
  end if;

  v_new_hearts := least(5, v_row.hearts + v_recovered);

  update public.user_progress
     set hearts = v_new_hearts,
         hearts_updated_at = case
           when v_new_hearts >= 5 then now()
           else v_row.hearts_updated_at + (v_recovered * interval '20 minutes')
         end
   where user_id = p_user_id
   returning * into v_row;

  return v_row;
end;
$$;

-- ============================================================
-- Helper RPC: add_xp
-- Adds XP, respects daily cap of 800 (50% reduction after cap).
-- Resets daily counter at midnight automatically.
-- Returns the granted XP (after reduction) and the updated row.
-- ============================================================
create or replace function public.add_xp(p_user_id uuid, p_amount int)
returns table(granted int, progress public.user_progress)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.user_progress;
  v_today date := current_date;
  v_granted int;
  v_remaining int;
  v_daily_cap int := 800;
begin
  perform public.ensure_progress_row(p_user_id);
  select * into v_row from public.user_progress where user_id = p_user_id;

  -- Reset daily counter if new day
  if v_row.daily_xp_date <> v_today then
    update public.user_progress
       set daily_xp = 0,
           daily_xp_date = v_today
     where user_id = p_user_id;
    v_row.daily_xp := 0;
    v_row.daily_xp_date := v_today;
  end if;

  -- Apply 50% reduction past the cap
  if v_row.daily_xp >= v_daily_cap then
    v_granted := floor(p_amount * 0.5);
  else
    v_remaining := v_daily_cap - v_row.daily_xp;
    if p_amount <= v_remaining then
      v_granted := p_amount;
    else
      -- mixed: full for the portion under cap, half for the overflow
      v_granted := v_remaining + floor((p_amount - v_remaining) * 0.5);
    end if;
  end if;

  update public.user_progress
     set xp           = xp + v_granted,
         daily_xp     = daily_xp + v_granted,
         total_points = total_points + v_granted
   where user_id = p_user_id
   returning * into v_row;

  return query select v_granted, v_row;
end;
$$;

-- ============================================================
-- Helper RPC: add_stars
-- Adds stars (no cap). Negative amounts allowed (purchases).
-- Errors out if balance would go below 0.
-- ============================================================
create or replace function public.add_stars(p_user_id uuid, p_amount int)
returns public.user_progress
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.user_progress;
begin
  perform public.ensure_progress_row(p_user_id);

  update public.user_progress
     set stars = stars + p_amount
   where user_id = p_user_id
     and (stars + p_amount) >= 0
   returning * into v_row;

  if v_row is null then
    raise exception 'Insufficient stars';
  end if;

  return v_row;
end;
$$;

-- ============================================================
-- Helper RPC: consume_heart
-- Decrement hearts by 1 (after a failed challenge).
-- Updates hearts_updated_at if dropping from 5 to start the recovery clock.
-- ============================================================
create or replace function public.consume_heart(p_user_id uuid)
returns public.user_progress
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.user_progress;
begin
  perform public.ensure_progress_row(p_user_id);
  select * into v_row from public.user_progress where user_id = p_user_id;

  if v_row.hearts <= 0 then
    return v_row;
  end if;

  update public.user_progress
     set hearts = hearts - 1,
         hearts_updated_at = case
           when v_row.hearts = 5 then now()
           else hearts_updated_at
         end
   where user_id = p_user_id
   returning * into v_row;

  return v_row;
end;
$$;
