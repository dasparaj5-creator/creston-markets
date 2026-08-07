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
  create type referral_trigger_enum as enum ('account_maturity');
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

-- ---------------------------------------------------------------------------
-- TABLE: plans
-- ---------------------------------------------------------------------------
create table if not exists plans (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,                       -- Bronze, Silver, Gold
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
  kyc_document_url text,
  plan_id uuid references plans(id),
  plan_activated_at timestamptz,
  account_active_since timestamptz,         -- set when first deposit approved
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_users_referred_by on users(referred_by);
create index if not exists idx_users_referral_code on users(referral_code);

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
-- TABLE: withdrawals
-- Phase 1: interest-registration only. No funds move.
-- ---------------------------------------------------------------------------
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

-- portfolio_snapshots: client can only ever see mt5_api rows for themself;
-- reconciliation rows are admin-only (enforced here, not just in UI)
create policy "snapshots_select_self_mt5_or_admin" on portfolio_snapshots for select
  using ( (auth.uid() = user_id and source = 'mt5_api') or is_admin() );
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
-- account_active_since and start the 30-day referral maturity clock.
create or replace function handle_deposit_approval() returns trigger as $$
declare
  v_user users%rowtype;
  v_config referral_config%rowtype;
begin
  if new.status = 'approved' and old.status <> 'approved' then
    select * into v_user from users where id = new.user_id;

    if v_user.account_active_since is null then
      update users set account_active_since = now() where id = new.user_id;

      update deposits set is_first_deposit = true where id = new.id;

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
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_deposit_approval on deposits;
create trigger trg_deposit_approval after update on deposits
  for each row execute function handle_deposit_approval();

-- ============================================================================
-- End of schema
-- ============================================================================
