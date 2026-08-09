-- ============================================================================
-- Creston Markets — Migration 003
-- Run this in Supabase SQL Editor AFTER migration_002.sql has already run.
-- Adds: manual USDT deposit addresses/proofs, 5-level referral & earnings
-- system (versioned config, frozen-rate commission records, settlement-
-- gated profit share), and the is_settlement / settlement_period flag on
-- portfolio_snapshots.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Manual USDT deposit addresses + proof-of-payment
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

create table if not exists deposit_proofs (
  id uuid primary key default uuid_generate_v4(),
  deposit_id uuid not null references deposits(id) on delete cascade,
  network crypto_network_enum not null,
  transaction_hash text not null,
  screenshot_path text,
  created_at timestamptz default now()
);

create index if not exists idx_deposit_proofs_deposit on deposit_proofs(deposit_id);

alter table crypto_deposit_addresses enable row level security;
alter table deposit_proofs enable row level security;

create policy "crypto_addresses_select_all" on crypto_deposit_addresses for select using (true);
create policy "crypto_addresses_admin_write" on crypto_deposit_addresses for all
  using (is_admin()) with check (is_admin());

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

-- ---------------------------------------------------------------------------
-- 2. Settlement flag on portfolio_snapshots
-- ---------------------------------------------------------------------------
alter table portfolio_snapshots add column if not exists is_settlement boolean not null default false;
alter table portfolio_snapshots add column if not exists settlement_period text;

-- ---------------------------------------------------------------------------
-- 3. Versioned commission config + frozen-rate commission records
-- ---------------------------------------------------------------------------
create table if not exists commission_config (
  id uuid primary key default uuid_generate_v4(),
  level integer not null check (level between 1 and 5),
  joining_bonus_amount numeric not null default 0,
  joining_bonus_enabled boolean not null default true,
  profit_share_percent numeric not null default 0,
  profit_share_enabled boolean not null default true,
  effective_from timestamptz not null default now(),
  created_by uuid references users(id),
  created_at timestamptz default now()
);

create index if not exists idx_commission_config_level on commission_config(level);
create index if not exists idx_commission_config_effective on commission_config(effective_from desc);

do $$ begin
  create type commission_type_enum as enum ('joining_bonus', 'profit_share');
exception when duplicate_object then null; end $$;

do $$ begin
  create type commission_status_enum as enum ('pending', 'paid');
exception when duplicate_object then null; end $$;

create table if not exists commission_records (
  id uuid primary key default uuid_generate_v4(),
  beneficiary_id uuid not null references users(id),
  source_user_id uuid not null references users(id),
  level integer not null check (level between 1 and 5),
  commission_type commission_type_enum not null,
  rate_at_time numeric,
  bonus_amount_at_time numeric,
  base_amount numeric not null,
  commission_earned numeric not null,
  status commission_status_enum not null default 'pending',
  paid_at timestamptz,
  paid_by uuid references users(id),
  source_snapshot_id uuid references portfolio_snapshots(id),
  source_deposit_id uuid references deposits(id),
  settlement_period text,
  created_at timestamptz default now()
);

create index if not exists idx_commission_records_beneficiary on commission_records(beneficiary_id);
create index if not exists idx_commission_records_source_user on commission_records(source_user_id);
create index if not exists idx_commission_records_status on commission_records(status);

create table if not exists commission_config_audit (
  id uuid primary key default uuid_generate_v4(),
  changed_by uuid references users(id),
  level integer not null,
  field_changed text not null,
  old_value text,
  new_value text,
  changed_at timestamptz default now()
);

alter table commission_config enable row level security;
alter table commission_records enable row level security;
alter table commission_config_audit enable row level security;

create policy "commission_config_select_all" on commission_config for select using (true);
create policy "commission_config_admin_insert" on commission_config for insert
  with check (is_admin());

create policy "commission_records_select" on commission_records for select
  using (auth.uid() = beneficiary_id or is_admin());
create policy "commission_records_admin_write" on commission_records for all
  using (is_admin()) with check (is_admin());

create policy "commission_config_audit_admin_only" on commission_config_audit for select using (is_admin());
create policy "commission_config_audit_insert_admin" on commission_config_audit for insert with check (is_admin());

-- ---------------------------------------------------------------------------
-- 4. Joining bonus distribution -- extends the existing deposit-approval
--    trigger to also walk up to 5 levels of upline.
-- ---------------------------------------------------------------------------
create or replace function handle_deposit_approval() returns trigger as $$
declare
  v_user users%rowtype;
  v_config referral_config%rowtype;
  v_upline_id uuid;
  v_level integer;
  v_commission_config commission_config%rowtype;
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

      v_upline_id := v_user.referred_by;
      v_level := 1;

      while v_upline_id is not null and v_level <= 5 loop
        select * into v_commission_config
        from commission_config
        where level = v_level and effective_from <= now()
        order by effective_from desc
        limit 1;

        if found and v_commission_config.joining_bonus_enabled and v_commission_config.joining_bonus_amount > 0 then
          insert into commission_records (
            beneficiary_id, source_user_id, level, commission_type,
            bonus_amount_at_time, base_amount, commission_earned,
            status, source_deposit_id
          ) values (
            v_upline_id, v_user.id, v_level, 'joining_bonus',
            v_commission_config.joining_bonus_amount, new.amount, v_commission_config.joining_bonus_amount,
            'pending', new.id
          );
        end if;

        select referred_by into v_upline_id from users where id = v_upline_id;
        v_level := v_level + 1;
      end loop;
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_deposit_approval on deposits;
create trigger trg_deposit_approval after update on deposits
  for each row execute function handle_deposit_approval();

-- ---------------------------------------------------------------------------
-- 5. Profit share distribution -- fires ONLY on is_settlement = true.
-- ---------------------------------------------------------------------------
create or replace function handle_snapshot_profit_share() returns trigger as $$
declare
  v_previous_balance numeric;
  v_profit_gain numeric;
  v_upline_id uuid;
  v_level integer;
  v_commission_config commission_config%rowtype;
  v_commission_amount numeric;
begin
  if not new.is_settlement then
    return new;
  end if;

  select balance into v_previous_balance
  from portfolio_snapshots
  where user_id = new.user_id
    and id <> new.id
    and is_settlement = true
    and created_at < new.created_at
  order by created_at desc
  limit 1;

  if v_previous_balance is null then
    return new;
  end if;

  v_profit_gain := new.balance - v_previous_balance;

  if v_profit_gain <= 0 then
    return new;
  end if;

  select referred_by into v_upline_id from users where id = new.user_id;
  v_level := 1;

  while v_upline_id is not null and v_level <= 5 loop
    select * into v_commission_config
    from commission_config
    where level = v_level and effective_from <= now()
    order by effective_from desc
    limit 1;

    if found and v_commission_config.profit_share_enabled and v_commission_config.profit_share_percent > 0 then
      v_commission_amount := round(v_profit_gain * v_commission_config.profit_share_percent / 100, 2);

      if v_commission_amount > 0 then
        insert into commission_records (
          beneficiary_id, source_user_id, level, commission_type,
          rate_at_time, base_amount, commission_earned,
          status, source_snapshot_id, settlement_period
        ) values (
          v_upline_id, new.user_id, v_level, 'profit_share',
          v_commission_config.profit_share_percent, v_profit_gain, v_commission_amount,
          'pending', new.id, new.settlement_period
        );
      end if;
    end if;

    select referred_by into v_upline_id from users where id = v_upline_id;
    v_level := v_level + 1;
  end loop;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_snapshot_profit_share on portfolio_snapshots;
create trigger trg_snapshot_profit_share after insert on portfolio_snapshots
  for each row execute function handle_snapshot_profit_share();

-- ---------------------------------------------------------------------------
-- 6. Default 5-level config (only inserts if not already present)
-- ---------------------------------------------------------------------------
insert into commission_config (level, joining_bonus_amount, joining_bonus_enabled, profit_share_percent, profit_share_enabled)
select * from (values
  (1, 10, true, 5, true),
  (2, 7, true, 4, true),
  (3, 4, true, 3, true),
  (4, 3, true, 2, true),
  (5, 1, true, 1, true)
) as defaults(level, joining_bonus_amount, joining_bonus_enabled, profit_share_percent, profit_share_enabled)
where not exists (select 1 from commission_config);

-- ============================================================================
-- End of migration 003
-- ============================================================================
