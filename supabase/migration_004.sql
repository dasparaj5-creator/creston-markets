-- ============================================================================
-- Creston Markets — Migration 004
-- Run this in Supabase SQL Editor AFTER migration_003.sql has already run.
-- Adds: Google OAuth support (auto-create public.users row on any new
-- auth.users row), and a terms_accepted_at gate so OAuth sign-ups -- who
-- never see the mandatory risk/terms checkboxes shown on the email
-- registration form -- are routed through a "complete your profile" step
-- before accessing the rest of the dashboard.
-- ============================================================================

-- 1. Add terms_accepted_at column
alter table users add column if not exists terms_accepted_at timestamptz;

-- 2. Backfill: everyone who already exists in the system registered
--    through the email/password flow (which already required these
--    acknowledgments), so mark them as already accepted -- this prevents
--    existing users (including seeded demo accounts and your admin login)
--    from being incorrectly locked out by the new gate.
update users set terms_accepted_at = created_at where terms_accepted_at is null;

-- 3. Auto-create a public.users profile row whenever a new auth.users row
--    is created via ANY method -- email/password signup, Google OAuth,
--    etc. This is what makes Google sign-in actually work end-to-end:
--    without it, a Google-authenticated user has no row in public.users
--    at all, and every page reading their profile breaks.
create or replace function handle_new_auth_user() returns trigger as $$
begin
  insert into public.users (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name')
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_new_auth_user on auth.users;
create trigger trg_new_auth_user after insert on auth.users
  for each row execute function handle_new_auth_user();

-- ============================================================================
-- End of migration 004
-- ============================================================================
