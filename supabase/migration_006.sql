-- ============================================================================
-- Creston Markets — Migration 006
-- Run this in Supabase SQL Editor AFTER migration_005.sql has already run.
--
-- REBUILDS the referral & earnings commission engine from a fixed
-- "rate per level" model to the CONFIRMED "rate per position, within
-- whichever of 5 tables matches the actual chain depth" model.
--
-- Concretely (per client confirmation): if A->B->C->D->E->F is a 5-deep
-- chain and F's deposit is approved, E (nearest to F) earns the largest
-- share, not a fixed "Level 1" person from the root. If the chain is
-- only 2 deep (H->I->J), a completely different 2-layer table applies,
-- not a partial slice of the 5-layer table. This migration replaces the
-- old fixed-level engine with this position/depth model end to end.
--
-- WARNING: this changes the shape of commission_config and
-- commission_records. If you already have rows in either table from the
-- OLD level-based system, they use a different column (`level` instead
-- of `chain_depth`/`position`) and will NOT be readable by the new code
-- after this migration. Historical commission_records rows are still
-- preserved in the database either way (nothing is deleted), but the
-- admin UI will only display records created after this migration runs.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Rebuild commission_config for the depth x position model.
--    Old table is dropped and recreated -- config values are just presets,
--    not financial history, so this is safe to replace outright.
-- ---------------------------------------------------------------------------
drop table if exists commission_config cascade;

create table commission_config (
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

create index idx_commission_config_depth_position on commission_config(chain_depth, position);
create index idx_commission_config_effective on commission_config(effective_from desc);

alter table commission_config enable row level security;
create policy "commission_config_select_all" on commission_config for select using (true);
create policy "commission_config_admin_insert" on commission_config for insert with check (is_admin());

-- ---------------------------------------------------------------------------
-- 2. Add chain_depth/position columns to commission_records (financial
--    history table -- ADD columns rather than drop/recreate, so any
--    existing records are preserved, just with null chain_depth/position
--    until new records are created going forward).
-- ---------------------------------------------------------------------------
alter table commission_records add column if not exists chain_depth integer;
alter table commission_records add column if not exists position integer;

-- ---------------------------------------------------------------------------
-- 3. Rebuild commission_config_audit for the depth x position model.
-- ---------------------------------------------------------------------------
drop table if exists commission_config_audit cascade;

create table commission_config_audit (
  id uuid primary key default uuid_generate_v4(),
  changed_by uuid references users(id),
  chain_depth integer not null,
  position integer not null,
  field_changed text not null,
  old_value text,
  new_value text,
  changed_at timestamptz default now()
);

alter table commission_config_audit enable row level security;
create policy "commission_config_audit_admin_only" on commission_config_audit for select using (is_admin());
create policy "commission_config_audit_insert_admin" on commission_config_audit for insert with check (is_admin());

-- ---------------------------------------------------------------------------
-- 4. New commission_notifications table -- surfaces "you earned a
--    commission" events to the beneficiary in-app (and via email once
--    custom SMTP is configured).
-- ---------------------------------------------------------------------------
create table if not exists commission_notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id),
  commission_record_id uuid not null references commission_records(id) on delete cascade,
  source_user_id uuid not null references users(id),
  chain_depth integer not null,
  position integer not null,
  commission_type commission_type_enum not null,
  is_read boolean not null default false,
  email_sent_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_commission_notifications_user on commission_notifications(user_id);
create index if not exists idx_commission_notifications_unread on commission_notifications(user_id, is_read);

alter table commission_notifications enable row level security;
create policy "commission_notifications_select_own" on commission_notifications for select
  using (auth.uid() = user_id or is_admin());
create policy "commission_notifications_update_own" on commission_notifications for update
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 5. Rewrite handle_deposit_approval(): walk the chain first to determine
--    ACTUAL depth (capped at 5), then apply the matching table.
-- ---------------------------------------------------------------------------
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

      v_walker := v_user.referred_by;
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

-- ---------------------------------------------------------------------------
-- 6. Rewrite handle_snapshot_profit_share() with the same depth-first logic.
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 7. Seed all 5 tables with the client-confirmed exact values.
-- ---------------------------------------------------------------------------
insert into commission_config (chain_depth, position, joining_bonus_amount, joining_bonus_enabled, profit_share_percent, profit_share_enabled)
values
  (1, 1, 25, true, 10, true),
  (2, 1, 15, true, 6, true),
  (2, 2, 10, true, 4, true),
  (3, 1, 15, true, 4, true),
  (3, 2, 6, true, 3.5, true),
  (3, 3, 4, true, 2.5, true),
  (4, 1, 15, true, 5, true),
  (4, 2, 6, true, 2.5, true),
  (4, 3, 3, true, 1.5, true),
  (4, 4, 1, true, 1, true),
  (5, 1, 15, true, 5, true),
  (5, 2, 5, true, 2, true),
  (5, 3, 3, true, 1, true),
  (5, 4, 2, true, 1, true),
  (5, 5, 1, true, 1, true);

-- ============================================================================
-- End of migration 006
-- ============================================================================
