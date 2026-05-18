-- ============================================================
-- SignLingo: Leaderboard RPC
-- ============================================================
-- RLS on user_progress and profiles intentionally restricts SELECT
-- to the owning user, which means a plain client-side leaderboard
-- query returns only the current user's row.
--
-- This RPC runs as the function owner (security definer), so it can
-- read across users, but it only returns the public-safe columns
-- (user_id, display_name, xp, streak). Hearts, daily_missions,
-- email, etc. stay private.
-- ============================================================

create or replace function public.get_leaderboard(p_limit int default 20)
returns table(user_id uuid, display_name text, xp int, streak int)
language sql
security definer
set search_path = public
as $$
  select
    up.user_id,
    p.display_name,
    up.xp,
    up.streak
  from public.user_progress up
  left join public.profiles p on p.id = up.user_id
  order by up.xp desc nulls last, up.streak desc nulls last
  limit p_limit;
$$;

-- Allow anonymous + authenticated callers to invoke it
-- (the function itself enforces the column whitelist)
grant execute on function public.get_leaderboard(int) to anon, authenticated;
