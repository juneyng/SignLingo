-- ============================================================
-- SignLingo: Daily missions tracking
-- ============================================================
-- Adds a single JSONB column to user_progress and helper RPCs.
-- Mission state shape:
-- {
--   "date": "2026-05-14",
--   "signs_practiced": 2,
--   "quiz_done": false,
--   "challenge_done": true,
--   "claimed": ["challenge"]
-- }
-- ============================================================

alter table public.user_progress
  add column if not exists daily_missions jsonb not null default jsonb_build_object(
    'date', to_char(current_date, 'YYYY-MM-DD'),
    'signs_practiced', 0,
    'quiz_done', false,
    'challenge_done', false,
    'claimed', '[]'::jsonb
  );

-- ============================================================
-- Helper: fresh mission state for a given date
-- ============================================================
create or replace function public.fresh_daily_missions(p_date date)
returns jsonb
language sql
immutable
as $$
  select jsonb_build_object(
    'date', to_char(p_date, 'YYYY-MM-DD'),
    'signs_practiced', 0,
    'quiz_done', false,
    'challenge_done', false,
    'claimed', '[]'::jsonb
  );
$$;

-- ============================================================
-- Helper: rotate missions if the stored date is not today
-- Returns the (possibly rotated) jsonb.
-- ============================================================
create or replace function public.rotate_daily_missions(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.user_progress;
  v_today_str text := to_char(current_date, 'YYYY-MM-DD');
  v_fresh jsonb;
begin
  perform public.ensure_progress_row(p_user_id);
  select * into v_row from public.user_progress where user_id = p_user_id;

  if (v_row.daily_missions->>'date') is distinct from v_today_str then
    v_fresh := public.fresh_daily_missions(current_date);
    update public.user_progress
       set daily_missions = v_fresh
     where user_id = p_user_id;
    return v_fresh;
  end if;

  return v_row.daily_missions;
end;
$$;

-- ============================================================
-- bump_mission_progress
-- Called by the client whenever an activity completes.
-- p_kind: 'sign_practiced' | 'quiz_done' | 'challenge_done'
--
-- - sign_practiced: increments signs_practiced (capped at 3)
-- - quiz_done / challenge_done: sets the boolean to true
--
-- Returns the updated missions jsonb.
-- ============================================================
create or replace function public.bump_mission_progress(p_user_id uuid, p_kind text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_missions jsonb;
  v_new jsonb;
begin
  v_missions := public.rotate_daily_missions(p_user_id);

  if p_kind = 'sign_practiced' then
    v_new := jsonb_set(
      v_missions,
      '{signs_practiced}',
      to_jsonb(least(3, coalesce((v_missions->>'signs_practiced')::int, 0) + 1))
    );
  elsif p_kind = 'quiz_done' then
    v_new := jsonb_set(v_missions, '{quiz_done}', 'true'::jsonb);
  elsif p_kind = 'challenge_done' then
    v_new := jsonb_set(v_missions, '{challenge_done}', 'true'::jsonb);
  else
    raise exception 'Unknown mission kind: %', p_kind;
  end if;

  update public.user_progress
     set daily_missions = v_new
   where user_id = p_user_id;

  return v_new;
end;
$$;

-- ============================================================
-- claim_mission_reward
-- Marks a mission as claimed and grants the reward in one transaction.
-- Returns { claimed: bool, xp_granted: int, stars_granted: int, missions: jsonb }
--
-- Rejects if:
--   - mission not completed
--   - mission already claimed
-- ============================================================
create or replace function public.claim_mission_reward(p_user_id uuid, p_mission text)
returns table(claimed boolean, xp_granted int, stars_granted int, missions jsonb)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_missions jsonb;
  v_claimed_list jsonb;
  v_completed boolean;
  v_xp int := 0;
  v_stars int := 0;
  v_xp_actual int := 0;
begin
  v_missions := public.rotate_daily_missions(p_user_id);
  v_claimed_list := coalesce(v_missions->'claimed', '[]'::jsonb);

  -- Already claimed?
  if v_claimed_list @> to_jsonb(p_mission) then
    return query select false, 0, 0, v_missions;
    return;
  end if;

  -- Completed?
  if p_mission = 'signs' then
    v_completed := coalesce((v_missions->>'signs_practiced')::int, 0) >= 3;
    v_xp := 30; v_stars := 5;
  elsif p_mission = 'quiz' then
    v_completed := coalesce((v_missions->>'quiz_done')::boolean, false);
    v_xp := 25; v_stars := 10;
  elsif p_mission = 'challenge' then
    v_completed := coalesce((v_missions->>'challenge_done')::boolean, false);
    v_xp := 25; v_stars := 5;
  else
    raise exception 'Unknown mission: %', p_mission;
  end if;

  if not v_completed then
    return query select false, 0, 0, v_missions;
    return;
  end if;

  -- Grant XP via add_xp (respects daily cap)
  select granted into v_xp_actual from public.add_xp(p_user_id, v_xp);
  perform public.add_stars(p_user_id, v_stars);

  -- Mark claimed
  v_missions := jsonb_set(
    v_missions,
    '{claimed}',
    v_claimed_list || to_jsonb(p_mission)
  );
  update public.user_progress
     set daily_missions = v_missions
   where user_id = p_user_id;

  return query select true, v_xp_actual, v_stars, v_missions;
end;
$$;
