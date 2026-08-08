-- ============================================================================
-- Creston Markets — Migration 002
-- Run this in Supabase SQL Editor AFTER schema.sql has already been run.
-- Adds: multi-document KYC support, and updates the portfolio_snapshots
-- RLS policy so admin-verified account statements are visible to clients
-- (per confirmed Phase 1 operating model).
-- ============================================================================

-- New enums for multi-document KYC
do $$ begin
  create type kyc_document_type_enum as enum (
    'personal_id', 'aadhar_card', 'license', 'passport',
    'pan_card', 'voter_id', 'bank_statement'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type kyc_document_side_enum as enum ('front', 'back');
exception when duplicate_object then null; end $$;

-- New kyc_documents table
create table if not exists kyc_documents (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  document_type kyc_document_type_enum not null,
  side kyc_document_side_enum not null,
  file_path text not null,
  uploaded_at timestamptz default now()
);

create index if not exists idx_kyc_documents_user on kyc_documents(user_id);
create unique index if not exists uq_kyc_document_per_side on kyc_documents(user_id, document_type, side);

alter table kyc_documents enable row level security;

create policy "kyc_documents_select_self_or_admin" on kyc_documents for select
  using (auth.uid() = user_id or is_admin());
create policy "kyc_documents_insert_self" on kyc_documents for insert
  with check (auth.uid() = user_id);
create policy "kyc_documents_delete_self_or_admin" on kyc_documents for delete
  using (auth.uid() = user_id or is_admin());

-- Update portfolio_snapshots RLS: clients now see their own snapshots
-- regardless of source (admin-verified 'reconciliation' entries ARE the
-- real account statements until MT5 is connected).
drop policy if exists "snapshots_select_self_mt5_or_admin" on portfolio_snapshots;

create policy "snapshots_select_self_or_admin" on portfolio_snapshots for select
  using ( auth.uid() = user_id or is_admin() );

-- ============================================================================
-- End of migration 002
-- ============================================================================