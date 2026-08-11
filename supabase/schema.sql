-- ============================================================================
-- Creston Markets — Phase 1 Schema
-- Demonstration / onboarding environment. No live PAMM/MT5 connection.
-- Deposits and withdrawals are UI-only interest-registration flows in Phase 1.
-- ============================================================================

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------------
-- ENUM TYPES
-- ---------------------------------------------------------------------------
do $$ begin
  create type user_role as enum ('client', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type kyc_status_enum as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type request_status_enum as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type snapshot_source_enum as enum ('mt5_api', 'reconciliation');
exception when duplicate_object then null; end $$;

do $$ begin
  create type referral_trigger_enum as enum ('account_maturity', 'joining_bonus', 'profit_share');
exception when duplicate_object then null; end $$;

do $$ begin
  create type referral_status_enum as enum ('pending', 'eligible', 'paid');
exception when duplicate_object then null; end $$;

do $$ begin
  create type announcement_target_enum as enum ('all', 'specific_user');
exception when duplicate_object then null; end $$;

do $$ begin
  create type ticket_status_enum as enum ('open', 'in_progress', 'resolved');
exception when duplicate_object then null; end $$;

do $$ begin
  create type kyc_document_type_enum as enum (
    'personal_id', 'aadhar_card', 'license', 'passport',
    'pan_card', 'voter_id', 'bank_statement'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type kyc_document_side_enum as enum ('front', 'back');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- TABLE: plans
-- ---------------------------------------------------------------------------
create table if not exists plans (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,                -- Bronze, Silver, Gold
  min_deposit numeric not null,             -- 200, 350, 500
  description text,
  features jsonb default '[]'::jsonb,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- TABLE: users (mirrors auth.users, extended profile)
-- ---------------------------------------------------------------------------
create table if not exists users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  phone text,
  country text,
  referral_code text unique not null default substr(replace(uuid_generate_v4()::text, '-', ''), 1, 8),
  referred_by uuid references users(id),
  role user_role not null default 'client',
  kyc_status kyc_status_enum not null default 'pending',
  kyc_document_url text,  -- deprecated, kept for backward compat; use kyc_documents table
  plan_id uuid references plans(id),
  plan_activated_at timestamptz,
  account_active_since timestamptz,         -- set when first deposit approved
  is_active boolean default true,
  terms_accepted_at timestamptz,            -- required acknowledgment; null means the
                                             -- mandatory risk/terms step hasn't been completed
                                             -- yet (relevant for Google OAuth sign-ups, who
                                             -- never see the checkboxes shown on email signup)
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_users_referred_by on users(referred_by);
create index if not exists idx_users_referral_code on users(referral_code);

-- ---------------------------------------------------------------------------
-- TABLE: kyc_documents
-- Client selects 2 document types (e.g. Passport + Bank Statement), and
-- uploads front + back for each -- up to 4 files total. Each row is one
-- uploaded file; (user_id, document_type, side) is unique so a re-upload
-- replaces rather than duplicates.
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- TABLE: deposits
-- Phase 1: these are interest-registration records only. No funds move.
-- ---------------------------------------------------------------------------
create table if not exists deposits (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id),
  plan_id uuid references plans(id),
  amount numeric not null,
  currency text default 'USD',
  status request_status_enum not null default 'pending',
  payment_reference text,
  is_first_deposit boolean default false,
  approved_by uuid references users(id),
  approved_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_deposits_user on deposits(user_id);
create index if not exists idx_deposits_status on deposits(status);

-- ---------------------------------------------------------------------------
-- TABLE: crypto_deposit_addresses
-- Admin-configured receiving addresses for manual USDT deposits, one per
-- network. Client selects a network on the deposit page and sees the
-- matching address + QR code. Admin can edit these at any time.
-- ---------------------------------------------------------------------------
do $$ begin
  create type crypto_network_enum as enum ('ERC20', 'TRC20', 'BEP20');
exception when duplicate_object then null; end $$;

create table if not exists crypto_deposit_addresses (
  id uuid primary key default uuid_generate_v4(),
  network crypto_network_enum not null unique,
  wallet_address text not null,
  is_active boolean default true,
  updated_by uuid references users(id),
  updated_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- TABLE: deposit_proofs
-- One row per manual deposit submission -- transaction hash + optional
-- screenshot, submitted by the client, reviewed by admin within the
-- deposits table's existing approval workflow.
-- ---------------------------------------------------------------------------
create table if not exists deposit_proofs (
  id uuid primary key default uuid_generate_v4(),
  deposit_id uuid not null references deposits(id) on delete cascade,
  network crypto_network_enum not null,
  transaction_hash text not null,
  screenshot_path text,
  created_at timestamptz default now()
);

create index if not exists idx_deposit_proofs_deposit on deposit_proofs(deposit_id);
create table if not exists withdrawals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id),
  amount numeric not null,
  wallet_address text,
  payment_method text,
  status request_status_enum not null default 'pending',
  processed_by uuid references users(id),
  processed_at timestamptz,
  notes text,
  created_at timestamptz default now()
);

create index if not exists idx_withdrawals_user on withdrawals(user_id);
create index if not exists idx_withdrawals_status on withdrawals(status);

-- ---------------------------------------------------------------------------
-- TABLE: portfolio_snapshots
-- IMPORTANT: only rows with source = 'mt5_api' may ever be surfaced to a
-- client in dashboard/portfolio UI. 'reconciliation' rows are internal-only.
-- In Phase 1, no mt5_api rows will exist (MT5 is not connected).
-- ---------------------------------------------------------------------------
create table if not exists portfolio_snapshots (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id),
  balance numeric not null default 0,
  pnl_total numeric default 0,
  pnl_today numeric default 0,
  pnl_this_month numeric default 0,
  return_percent numeric default 0,
  snapshot_date date not null default current_date,
  source snapshot_source_enum not null default 'reconciliation',
  is_settlement boolean not null default false,
  settlement_period text,
  updated_by uuid references users(id),
  created_at timestamptz default now()
);

create index if not exists idx_snapshots_user on portfolio_snapshots(user_id);
create index if not exists idx_snapshots_source on portfolio_snapshots(source);

-- ---------------------------------------------------------------------------
-- TABLE: referral_bonuses
-- Single-tier only. referrer_id earns a flat bonus after referred user's
-- account has been active for `maturity_days` post first-deposit-approval.
-- ---------------------------------------------------------------------------
create table if not exists referral_bonuses (
  id uuid primary key default uuid_generate_v4(),
  referrer_id uuid not null references users(id),
  referred_user_id uuid not null references users(id),
  trigger_type referral_trigger_enum not null default 'account_maturity',
  bonus_amount numeric not null,
  status referral_status_enum not null default 'pending',
  eligible_after timestamptz not null,
  paid_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_referral_bonuses_referrer on referral_bonuses(referrer_id);
create index if not exists idx_referral_bonuses_status on referral_bonuses(status);
create unique index if not exists uq_referral_bonus_per_referred on referral_bonuses(referred_user_id);

-- ---------------------------------------------------------------------------
-- TABLE: referral_config (single row config)
-- Legacy Phase-1 single-tier config -- superseded by commission_config below
-- for the 5-level structure, but kept for backward compatibility with
-- existing referral_bonuses rows (Alice -> Ben, etc.) seeded under the
-- original single-tier model.
-- ---------------------------------------------------------------------------
create table if not exists referral_config (
  id uuid primary key default uuid_generate_v4(),
  bonus_amount numeric not null default 25,
  bonus_currency text default 'USD',
  maturity_days integer not null default 30,
  updated_by uuid references users(id),
  updated_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- TABLE: commission_config
-- Depth-based configuration for the 5-layer referral & earnings structure.
-- CRITICAL DESIGN NOTE: this is NOT "rate for level N" -- it's "rate for
-- position P, when the chain is exactly D layers deep". Five completely
-- separate tables exist (chain_depth 1 through 5), because a 2-person
-- chain and a 5-person chain split their $25/10% pools differently, not
-- as a partial slice of the 5-layer table. Position 1 within a table is
-- always the person NEAREST the newest joiner (the largest share);
-- position D (the last one) is furthest away.
--
-- NEVER updated in place -- every change inserts a new row with a fresh
-- effective_from timestamp, so historical commission calculations can
-- always look up "what rate was active at the time this was earned."
-- ---------------------------------------------------------------------------
create table if not exists commission_config (
  id uuid primary key default uuid_generate_v4(),
  chain_depth integer not null check (chain_depth between 1 and 5),
  position integer not null check (position between 1 and 5),
  joining_bonus_amount numeric not null default 0,
  joining_bonus_enabled boolean not null default true,
  profit_share_percent numeric not null default 0,
  profit_share_enabled boolean not null default true,
  effective_from timestamptz not null default now(),
  created_by uuid references users(id),
  created_at timestamptz default now(),
  constraint chk_position_within_depth check (position <= chain_depth)
);

create index if not exists idx_commission_config_depth_position on commission_config(chain_depth, position);
create index if not exists idx_commission_config_effective on commission_config(effective_from desc);

-- ---------------------------------------------------------------------------
-- TABLE: commission_records
-- One row per individual upline payout event. Rates are frozen at the time
-- of calculation (rate_at_time / bonus_amount_at_time) and NEVER recomputed
-- retroactively when commission_config changes later -- this is the core
-- historical-earnings-protection requirement.
-- ---------------------------------------------------------------------------
do $$ begin
  create type commission_type_enum as enum ('joining_bonus', 'profit_share');
exception when duplicate_object then null; end $$;

do $$ begin
  create type commission_status_enum as enum ('pending', 'paid');
exception when duplicate_object then null; end $$;

create table if not exists commission_records (
  id uuid primary key default uuid_generate_v4(),
  beneficiary_id uuid not null references users(id),      -- who earns this commission
  source_user_id uuid not null references users(id),      -- whose activity triggered it
  chain_depth integer not null check (chain_depth between 1 and 5), -- which table was used (1-5 layer)
  position integer not null check (position between 1 and 5),      -- this beneficiary's position within that table (1 = nearest)
  commission_type commission_type_enum not null,
  -- Frozen values at time of calculation -- never recalculated on config change:
  rate_at_time numeric,                 -- profit_share_percent used (profit_share only)
  bonus_amount_at_time numeric,         -- joining_bonus_amount used (joining_bonus only)
  base_amount numeric not null,         -- the profit or deposit amount commission was computed from
  commission_earned numeric not null,   -- frozen final payout amount
  status commission_status_enum not null default 'pending',
  paid_at timestamptz,
  paid_by uuid references users(id),
  source_snapshot_id uuid references portfolio_snapshots(id), -- which reconciliation entry triggered this (profit_share only)
  source_deposit_id uuid references deposits(id),             -- which deposit triggered this (joining_bonus only)
  settlement_period text,               -- e.g. "January 2025" (profit_share only, mirrors the triggering snapshot)
  created_at timestamptz default now()
);

create index if not exists idx_commission_records_beneficiary on commission_records(beneficiary_id);
create index if not exists idx_commission_records_source_user on commission_records(source_user_id);
create index if not exists idx_commission_records_status on commission_records(status);

-- ---------------------------------------------------------------------------
-- TABLE: commission_config_audit
-- Full audit trail of who changed what config value and when -- separate
-- from commission_config's own version history, this is a human-readable
-- change log for the admin UI ("Config change history").
-- ---------------------------------------------------------------------------
create table if not exists commission_config_audit (
  id uuid primary key default uuid_generate_v4(),
  changed_by uuid references users(id),
  chain_depth integer not null,
  position integer not null,
  field_changed text not null,          -- e.g. 'joining_bonus_amount', 'profit_share_percent'
  old_value text,
  new_value text,
  changed_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- TABLE: commission_notifications
-- One row per "you earned a commission" event, surfaced to the beneficiary
-- in their dashboard and (once SMTP is configured) via email. Distinct
-- from commission_records itself so read/unread state and notification
-- delivery can be tracked independently of the underlying financial record.
-- ---------------------------------------------------------------------------
create table if not exists commission_notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id),               -- the beneficiary being notified
  commission_record_id uuid not null references commission_records(id) on delete cascade,
  source_user_id uuid not null references users(id),        -- whose activity triggered the earning
  chain_depth integer not null,
  position integer not null,                                 -- which level (L1-L5) this user earned at
  commission_type commission_type_enum not null,
  is_read boolean not null default false,
  email_sent_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_commission_notifications_user on commission_notifications(user_id);
create index if not exists idx_commission_notifications_unread on commission_notifications(user_id, is_read);

-- ---------------------------------------------------------------------------
-- TABLE: announcements
-- ---------------------------------------------------------------------------
create table if not exists announcements (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  body text not null,
  target announcement_target_enum not null default 'all',
  target_user_id uuid references users(id),
  is_active boolean default true,
  created_by uuid references users(id),
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- TABLE: support_tickets
-- ---------------------------------------------------------------------------
create table if not exists support_tickets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id),
  subject text not null,
  message text not null,
  status ticket_status_enum not null default 'open',
  admin_reply text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_tickets_user on support_tickets(user_id);
create index if not exists idx_tickets_status on support_tickets(status);

-- ---------------------------------------------------------------------------
-- TABLE: error_logs
-- ---------------------------------------------------------------------------
create table if not exists error_logs (
  id uuid primary key default uuid_generate_v4(),
  level text not null,               -- INFO, WARN, ERROR, DEBUG
  message text not null,
  context jsonb default '{}'::jsonb,
  user_id uuid,
  page text,
  created_at timestamptz default now()
);

create index if not exists idx_error_logs_level on error_logs(level);
create index if not exists idx_error_logs_created on error_logs(created_at desc);

-- ---------------------------------------------------------------------------
-- TABLE: admin_audit_log
-- ---------------------------------------------------------------------------
create table if not exists admin_audit_log (
  id uuid primary key default uuid_generate_v4(),
  admin_id uuid not null,
  action text not null,
  target_type text not null,
  target_id uuid,
  before_value jsonb,
  after_value jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_audit_admin on admin_audit_log(admin_id);
create index if not exists idx_audit_created on admin_audit_log(created_at desc);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table users enable row level security;
alter table deposits enable row level security;
alter table withdrawals enable row level security;
alter table portfolio_snapshots enable row level security;
alter table referral_bonuses enable row level security;
alter table referral_config enable row level security;
alter table announcements enable row level security;
alter table support_tickets enable row level security;
alter table error_logs enable row level security;
alter table admin_audit_log enable row level security;
alter table plans enable row level security;
alter table kyc_documents enable row level security;
alter table crypto_deposit_addresses enable row level security;
alter table deposit_proofs enable row level security;
alter table commission_config enable row level security;
alter table commission_records enable row level security;
alter table commission_config_audit enable row level security;
alter table commission_notifications enable row level security;

-- helper: is current user an admin
create or replace function is_admin() returns boolean as $$
  select exists (
    select 1 from users where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- plans: readable by anyone (public pricing), writable by admin only
create policy "plans_select_all" on plans for select using (true);
create policy "plans_admin_write" on plans for all using (is_admin()) with check (is_admin());

-- users: self read/update; admin full access
create policy "users_select_self_or_admin" on users for select
  using (auth.uid() = id or is_admin());
create policy "users_update_self_or_admin" on users for update
  using (auth.uid() = id or is_admin());
create policy "users_admin_insert" on users for insert
  with check (auth.uid() = id or is_admin());

-- deposits: self + admin
create policy "deposits_select_self_or_admin" on deposits for select
  using (auth.uid() = user_id or is_admin());
create policy "deposits_insert_self" on deposits for insert
  with check (auth.uid() = user_id);
create policy "deposits_admin_update" on deposits for update
  using (is_admin());

-- withdrawals: self + admin
create policy "withdrawals_select_self_or_admin" on withdrawals for select
  using (auth.uid() = user_id or is_admin());
create policy "withdrawals_insert_self" on withdrawals for insert
  with check (auth.uid() = user_id);
create policy "withdrawals_admin_update" on withdrawals for update
  using (is_admin());

-- portfolio_snapshots: client can see their own rows regardless of source.
-- As of the operator's confirmed Phase 1 operating model, admin-entered
-- 'reconciliation' snapshots ARE the real account statements until MT5 is
-- connected -- they are manually verified by admin and intentionally
-- surfaced to the client, not just an internal-only record anymore.
create policy "snapshots_select_self_or_admin" on portfolio_snapshots for select
  using ( auth.uid() = user_id or is_admin() );
create policy "snapshots_admin_write" on portfolio_snapshots for insert
  with check (is_admin());
create policy "snapshots_admin_update" on portfolio_snapshots for update
  using (is_admin());

-- referral_bonuses: referrer can see their own earned bonuses; admin all
create policy "referral_bonuses_select" on referral_bonuses for select
  using (auth.uid() = referrer_id or is_admin());
create policy "referral_bonuses_admin_write" on referral_bonuses for all
  using (is_admin()) with check (is_admin());

-- referral_config: readable by all authenticated, writable by admin
create policy "referral_config_select" on referral_config for select using (true);
create policy "referral_config_admin_write" on referral_config for all
  using (is_admin()) with check (is_admin());

-- announcements: active + (target all OR targeted at me); admin manages
create policy "announcements_select" on announcements for select
  using ( is_active and (target = 'all' or target_user_id = auth.uid()) or is_admin() );
create policy "announcements_admin_write" on announcements for all
  using (is_admin()) with check (is_admin());

-- support_tickets: self + admin
create policy "tickets_select_self_or_admin" on support_tickets for select
  using (auth.uid() = user_id or is_admin());
create policy "tickets_insert_self" on support_tickets for insert
  with check (auth.uid() = user_id);
create policy "tickets_update_self_or_admin" on support_tickets for update
  using (auth.uid() = user_id or is_admin());

-- kyc_documents: self + admin
create policy "kyc_documents_select_self_or_admin" on kyc_documents for select
  using (auth.uid() = user_id or is_admin());
create policy "kyc_documents_insert_self" on kyc_documents for insert
  with check (auth.uid() = user_id);
create policy "kyc_documents_delete_self_or_admin" on kyc_documents for delete
  using (auth.uid() = user_id or is_admin());

-- crypto_deposit_addresses: readable by all authenticated (clients need to
-- see the address to pay to), writable by admin only
create policy "crypto_addresses_select_all" on crypto_deposit_addresses for select using (true);
create policy "crypto_addresses_admin_write" on crypto_deposit_addresses for all
  using (is_admin()) with check (is_admin());

-- deposit_proofs: client can insert/see their own (via the parent deposit's
-- ownership), admin sees all
create policy "deposit_proofs_select" on deposit_proofs for select
  using (
    is_admin() or exists (
      select 1 from deposits d where d.id = deposit_proofs.deposit_id and d.user_id = auth.uid()
    )
  );
create policy "deposit_proofs_insert" on deposit_proofs for insert
  with check (
    exists (
      select 1 from deposits d where d.id = deposit_proofs.deposit_id and d.user_id = auth.uid()
    )
  );

-- commission_config: readable by all authenticated (clients may want to see
-- current rates), writable by admin only. Never allow UPDATE/DELETE from
-- the API layer -- always insert a new version row (enforced by app logic
-- and by only granting insert/select here, not update/delete).
create policy "commission_config_select_all" on commission_config for select using (true);
create policy "commission_config_admin_insert" on commission_config for insert
  with check (is_admin());

-- commission_records: beneficiary can see their own earnings, admin sees all
create policy "commission_records_select" on commission_records for select
  using (auth.uid() = beneficiary_id or is_admin());
create policy "commission_records_admin_write" on commission_records for all
  using (is_admin()) with check (is_admin());

-- commission_config_audit: admin only
create policy "commission_config_audit_admin_only" on commission_config_audit for select using (is_admin());
create policy "commission_config_audit_insert_admin" on commission_config_audit for insert with check (is_admin());

-- commission_notifications: user sees/marks-read their own, system inserts via security-definer triggers
create policy "commission_notifications_select_own" on commission_notifications for select
  using (auth.uid() = user_id or is_admin());
create policy "commission_notifications_update_own" on commission_notifications for update
  using (auth.uid() = user_id);

-- error_logs: admin only
create policy "error_logs_admin_only" on error_logs for select using (is_admin());
create policy "error_logs_insert_any" on error_logs for insert with check (true);

-- admin_audit_log: admin only
create policy "audit_admin_only" on admin_audit_log for select using (is_admin());
create policy "audit_insert_admin" on admin_audit_log for insert with check (is_admin());

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- keep users.updated_at fresh
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_users_updated_at on users;
create trigger trg_users_updated_at before update on users
  for each row execute function set_updated_at();

drop trigger if exists trg_tickets_updated_at on support_tickets;
create trigger trg_tickets_updated_at before update on support_tickets
  for each row execute function set_updated_at();

-- On deposit approval: if it's the user's first approved deposit, stamp
-- account_active_since, start the legacy 30-day referral maturity clock
-- (kept for backward-compat with pre-existing referral_bonuses rows), AND
-- distribute the multi-level joining bonus up to 5 levels of upline.
create or replace function handle_deposit_approval() returns trigger as $$
declare
  v_user users%rowtype;
  v_config referral_config%rowtype;
  v_upline_ids uuid[] := '{}';
  v_walker uuid;
  v_chain_depth integer;
  v_position integer;
  v_commission_config commission_config%rowtype;
  v_new_record_id uuid;
begin
  if new.status = 'approved' and old.status <> 'approved' then
    select * into v_user from users where id = new.user_id;

    if v_user.account_active_since is null then
      update users set account_active_since = now() where id = new.user_id;
      update deposits set is_first_deposit = true where id = new.id;

      -- Legacy single-tier bonus (backward compat only, unrelated to the
      -- 5-table depth-based system below)
      if v_user.referred_by is not null then
        select * into v_config from referral_config order by updated_at desc limit 1;

        insert into referral_bonuses (
          referrer_id, referred_user_id, trigger_type, bonus_amount,
          status, eligible_after
        ) values (
          v_user.referred_by,
          v_user.id,
          'account_maturity',
          coalesce(v_config.bonus_amount, 25),
          'pending',
          now() + make_interval(days => coalesce(v_config.maturity_days, 30))
        )
        on conflict (referred_user_id) do nothing;
      end if;

      -- ---------------------------------------------------------------
      -- Depth-based joining bonus distribution.
      --
      -- Step 1: walk up the referred_by chain and collect up to 5 upline
      -- ids, nearest first. This determines the ACTUAL chain depth (1-5),
      -- which decides which of the five preset tables applies -- NOT a
      -- fixed "level 1 always means root referrer" scheme. Anyone beyond
      -- the 5th position is simply never collected and earns nothing on
      -- this event, matching the confirmed roll-off behavior.
      -- ---------------------------------------------------------------
      v_walker := v_user.referred_by;
      while v_walker is not null and array_length(v_upline_ids, 1) is distinct from 5 loop
        v_upline_ids := array_append(v_upline_ids, v_walker);
        select referred_by into v_walker from users where id = v_walker;
      end loop;

      v_chain_depth := coalesce(array_length(v_upline_ids, 1), 0);

      -- Step 2: for each collected upline member, look up their position's
      -- rate within the table matching the ACTUAL chain depth, and record
      -- a frozen commission.
      if v_chain_depth > 0 then
        for v_position in 1..v_chain_depth loop
          select * into v_commission_config
          from commission_config
          where chain_depth = v_chain_depth
            and position = v_position
            and effective_from <= now()
          order by effective_from desc
          limit 1;

          if found and v_commission_config.joining_bonus_enabled and v_commission_config.joining_bonus_amount > 0 then
            insert into commission_records (
              beneficiary_id, source_user_id, chain_depth, position, commission_type,
              bonus_amount_at_time, base_amount, commission_earned,
              status, source_deposit_id
            ) values (
              v_upline_ids[v_position], v_user.id, v_chain_depth, v_position, 'joining_bonus',
              v_commission_config.joining_bonus_amount, new.amount, v_commission_config.joining_bonus_amount,
              'pending', new.id
            )
            returning id into v_new_record_id;

            insert into commission_notifications (
              user_id, commission_record_id, source_user_id, chain_depth, position, commission_type
            ) values (
              v_upline_ids[v_position], v_new_record_id, v_user.id, v_chain_depth, v_position, 'joining_bonus'
            );
          end if;
        end loop;
      end if;
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_deposit_approval on deposits;
create trigger trg_deposit_approval after update on deposits
  for each row execute function handle_deposit_approval();

-- On a new SETTLEMENT snapshot only (is_settlement = true): compute this
-- user's profit gain since their previous settlement snapshot, then
-- distribute profit-share commissions up to 5 levels of upline based on
-- that gain. Routine/corrective reconciliation entries (is_settlement =
-- false) are saved normally but never trigger commission calculations --
-- this is a deliberate admin action, not an automatic side effect of every
-- balance edit.
create or replace function handle_snapshot_profit_share() returns trigger as $$
declare
  v_previous_balance numeric;
  v_profit_gain numeric;
  v_upline_ids uuid[] := '{}';
  v_walker uuid;
  v_chain_depth integer;
  v_position integer;
  v_commission_config commission_config%rowtype;
  v_commission_amount numeric;
  v_new_record_id uuid;
begin
  -- Only settlement events trigger commissions.
  if not new.is_settlement then
    return new;
  end if;

  -- Find this user's most recent PRIOR settlement snapshot (before this one).
  select balance into v_previous_balance
  from portfolio_snapshots
  where user_id = new.user_id
    and id <> new.id
    and is_settlement = true
    and created_at < new.created_at
  order by created_at desc
  limit 1;

  -- No prior settlement -> this is the first official period, no profit
  -- baseline to compare against yet.
  if v_previous_balance is null then
    return new;
  end if;

  v_profit_gain := new.balance - v_previous_balance;

  -- Only distribute on a positive gain -- losses are not clawed back from
  -- upline in this model.
  if v_profit_gain <= 0 then
    return new;
  end if;

  -- Walk up to 5 upline members, nearest first, same as the joining bonus
  -- logic -- this determines chain depth and which preset table applies.
  select referred_by into v_walker from users where id = new.user_id;
  while v_walker is not null and array_length(v_upline_ids, 1) is distinct from 5 loop
    v_upline_ids := array_append(v_upline_ids, v_walker);
    select referred_by into v_walker from users where id = v_walker;
  end loop;

  v_chain_depth := coalesce(array_length(v_upline_ids, 1), 0);

  if v_chain_depth > 0 then
    for v_position in 1..v_chain_depth loop
      select * into v_commission_config
      from commission_config
      where chain_depth = v_chain_depth
        and position = v_position
        and effective_from <= now()
      order by effective_from desc
      limit 1;

      if found and v_commission_config.profit_share_enabled and v_commission_config.profit_share_percent > 0 then
        v_commission_amount := round(v_profit_gain * v_commission_config.profit_share_percent / 100, 2);

        if v_commission_amount > 0 then
          insert into commission_records (
            beneficiary_id, source_user_id, chain_depth, position, commission_type,
            rate_at_time, base_amount, commission_earned,
            status, source_snapshot_id, settlement_period
          ) values (
            v_upline_ids[v_position], new.user_id, v_chain_depth, v_position, 'profit_share',
            v_commission_config.profit_share_percent, v_profit_gain, v_commission_amount,
            'pending', new.id, new.settlement_period
          )
          returning id into v_new_record_id;

          insert into commission_notifications (
            user_id, commission_record_id, source_user_id, chain_depth, position, commission_type
          ) values (
            v_upline_ids[v_position], v_new_record_id, new.user_id, v_chain_depth, v_position, 'profit_share'
          );
        end if;
      end if;
    end loop;
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_snapshot_profit_share on portfolio_snapshots;
create trigger trg_snapshot_profit_share after insert on portfolio_snapshots
  for each row execute function handle_snapshot_profit_share();

-- Auto-create a public.users profile row whenever a new auth.users row is
-- created via ANY method -- email/password signup, Google OAuth, etc.
--
-- For email/password signups (via the Register page), full_name, phone,
-- country, referred_by, and terms_accepted_at are all passed through as
-- signUp() metadata and read here directly -- NOT written by a follow-up
-- client-side call after signUp() resolves. This matters because
-- Supabase's email-confirmation flow means there is no active session
-- immediately after signUp() returns, so any follow-up write would be
-- blocked by RLS until the user clicks the confirmation link. Populating
-- the full row atomically here avoids that race condition entirely.
--
-- For Google OAuth sign-ups, none of this metadata exists, so the row is
-- created with just email/full_name and terms_accepted_at stays null --
-- middleware then routes them through /dashboard/complete-profile to
-- collect the rest and record their acknowledgment explicitly.
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
-- Default commission_config seed -- exact values confirmed by the client,
-- covering all five depth tables (1 through 5 layers). Admin can change
-- these later via the admin panel; each change inserts a new versioned
-- row rather than updating these in place.
-- ============================================================================
insert into commission_config (chain_depth, position, joining_bonus_amount, joining_bonus_enabled, profit_share_percent, profit_share_enabled)
values
  -- 1 layer: sole referrer gets the full pool
  (1, 1, 25, true, 10, true),

  -- 2 layers: nearest / 2nd nearest
  (2, 1, 15, true, 6, true),
  (2, 2, 10, true, 4, true),

  -- 3 layers
  (3, 1, 15, true, 4, true),
  (3, 2, 6, true, 3.5, true),
  (3, 3, 4, true, 2.5, true),

  -- 4 layers
  (4, 1, 15, true, 5, true),
  (4, 2, 6, true, 2.5, true),
  (4, 3, 3, true, 1.5, true),
  (4, 4, 1, true, 1, true),

  -- 5 layers
  (5, 1, 15, true, 5, true),
  (5, 2, 5, true, 2, true),
  (5, 3, 3, true, 1, true),
  (5, 4, 2, true, 1, true),
  (5, 5, 1, true, 1, true)
on conflict do nothing;

-- ============================================================================
-- End of schema
-- ============================================================================
