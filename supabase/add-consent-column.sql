-- ============================================================
-- SignLingo: Privacy consent + optional demographics
-- ============================================================
-- Run this in Supabase SQL Editor.
--
-- consent_at:        null = privacy modal not yet completed.
-- The rest are optional demographic fields collected via the
-- onboarding modal. All are nullable / free-text on the DB side;
-- valid value lists are enforced by the client UI.
-- ============================================================

alter table public.profiles
  add column if not exists consent_at       timestamptz,
  add column if not exists birth_year       int,
  add column if not exists gender           text,
  add column if not exists ksl_experience   text,
  add column if not exists learning_purpose text,
  add column if not exists occupation_type  text;

-- No backfill — existing users will see the consent modal on
-- their next visit, which is what we want for the new policy.
