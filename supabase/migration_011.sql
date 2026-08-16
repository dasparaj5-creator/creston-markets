-- ============================================================================
-- Creston Markets — Migration 011
-- Fixes a real bug: referral links were never actually linking anyone.
--
-- ROOT CAUSE: the registration page looks up a referrer's user id by
-- their referral_code BEFORE the new visitor has an authenticated
-- session (this is intentional and necessary -- see the comment in
-- app/(public)/register/page.tsx explaining why it must happen pre-
-- signUp). But the only existing RLS select policies on `users`
-- (users_select_self_or_admin, users_select_own_downline) both require
-- auth.uid() to already be set -- an anonymous visitor filling out the
-- registration form has no session at all yet, so the lookup query was
-- silently blocked by RLS and always returned zero rows. No error was
-- ever shown; referred_by just silently stayed null on every single
-- registration that used a referral link, for as long as this policy
-- gap has existed.
--
-- FIX: add a policy allowing ANYONE (including anonymous/logged-out
-- visitors) to look up an id by referral_code specifically. This is
-- deliberately narrow -- it does not expose any other column or allow
-- browsing/listing users, only a targeted "does this exact code exist,
-- and if so what id does it belong to" lookup, which is exactly what
-- registration needs and is no more sensitive than the referral link
-- itself already being shareable/public by design.
--
-- Run this in Supabase SQL Editor after migration_010.sql.
-- ============================================================================

-- FIX: rather than a broad "anyone can select any row" policy (which
-- would technically let a caller query for OTHER columns too, since
-- Postgres RLS is per-row not per-column), this uses a SECURITY DEFINER
-- function that looks up an id by referral_code and returns ONLY that
-- id -- nothing else about the matched user is ever exposed through
-- this path, regardless of how the caller queries it. This is the
-- correct way to expose a narrow, public lookup without loosening RLS
-- on the table itself.
create or replace function get_user_id_by_referral_code(code text)
returns uuid as $$
  select id from users where referral_code = code limit 1;
$$ language sql security definer stable;

-- Allow anyone (including anonymous/logged-out visitors) to call this
-- specific function -- this is the actual fix for the registration bug.
grant execute on function get_user_id_by_referral_code(text) to anon, authenticated;

-- ============================================================================
-- End of migration 011
-- ============================================================================
