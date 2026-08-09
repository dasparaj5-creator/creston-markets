-- ============================================================================
-- Creston Markets — Migration 005
-- Run this in Supabase SQL Editor AFTER migration_004.sql has already run.
--
-- Fixes a real bug found in live testing: the Register page previously
-- wrote phone/country/terms_accepted_at to public.users in a SEPARATE
-- call after auth.signUp() resolved. Because Supabase requires email
-- confirmation before a session becomes active, that follow-up write was
-- silently blocked by RLS for any signup requiring confirmation -- so
-- terms_accepted_at never got set, and users who later confirmed their
-- email and logged in were incorrectly redirected to
-- /dashboard/complete-profile asking for information they'd already
-- provided at signup.
--
-- Fix: profile data is now passed as signUp() metadata and read directly
-- by the handle_new_auth_user() trigger, so the full profile row is
-- created atomically with no dependency on session/confirmation timing.
-- ============================================================================

create or replace function handle_new_auth_user() returns trigger as $$
declare
  v_referred_by uuid;
  v_terms_accepted_at text;
begin
  v_referred_by := nullif(new.raw_user_meta_data->>'referred_by', '')::uuid;
  v_terms_accepted_at := new.raw_user_meta_data->>'terms_accepted_at';

  insert into public.users (id, email, full_name, phone, country, referred_by, terms_accepted_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'country',
    v_referred_by,
    case when v_terms_accepted_at is not null then v_terms_accepted_at::timestamptz else null end
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_new_auth_user on auth.users;
create trigger trg_new_auth_user after insert on auth.users
  for each row execute function handle_new_auth_user();

-- ============================================================================
-- Storage RLS policies -- these were missing from the original setup.
-- A private bucket with NO storage.objects policies means literally
-- nobody can upload to it via the client SDK, even authenticated users --
-- this is very likely the root cause of the "Upload failed" KYC error
-- seen in live testing (Supabase Storage returns 400 for this case).
--
-- Run this section even if you already created the kyc-documents and
-- deposit-proofs buckets manually in the dashboard -- creating a bucket
-- does NOT automatically create these policies.
-- ============================================================================

-- kyc-documents: a user may upload/view/delete only within their own
-- user-id-prefixed folder (path convention: {user_id}/filename). Admins
-- can view everything.
create policy "kyc_docs_insert_own_folder" on storage.objects for insert
  with check (
    bucket_id = 'kyc-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "kyc_docs_select_own_or_admin" on storage.objects for select
  using (
    bucket_id = 'kyc-documents'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or is_admin()
    )
  );

create policy "kyc_docs_delete_own_or_admin" on storage.objects for delete
  using (
    bucket_id = 'kyc-documents'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or is_admin()
    )
  );

-- deposit-proofs: same pattern -- own folder only, admin sees all.
create policy "deposit_proofs_insert_own_folder" on storage.objects for insert
  with check (
    bucket_id = 'deposit-proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "deposit_proofs_select_own_or_admin" on storage.objects for select
  using (
    bucket_id = 'deposit-proofs'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or is_admin()
    )
  );

-- ============================================================================
-- End of migration 005
-- ============================================================================
