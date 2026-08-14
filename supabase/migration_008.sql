-- ============================================================================
-- Creston Markets — Migration 008
-- Adds Client Groups: admin-defined groups of clients for bulk
-- reconciliation updates and group-specific commission rate overrides.
-- Run this in Supabase SQL Editor after migration_007.sql.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- TABLE: client_groups
-- ---------------------------------------------------------------------------
create table if not exists client_groups (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  created_by uuid references users(id),
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- TABLE: client_group_members
-- Many-to-many: a client can belong to more than one group, a group has
-- many members.
-- ---------------------------------------------------------------------------
create table if not exists client_group_members (
  group_id uuid not null references client_groups(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  added_by uuid references users(id),
  added_at timestamptz default now(),
  primary key (group_id, user_id)
);

create index if not exists idx_client_group_members_user on client_group_members(user_id);

-- ---------------------------------------------------------------------------
-- TABLE: group_commission_overrides
-- Optional group-specific commission rates -- if a group has an override
-- row for a given (chain_depth, position), that rate is used INSTEAD OF
-- the platform-wide commission_config rate for any beneficiary who is a
-- member of that group at the moment a commission is calculated. If a
-- beneficiary belongs to multiple groups with overrides for the same
-- position, the most-recently-created override wins.
-- ---------------------------------------------------------------------------
create table if not exists group_commission_overrides (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid not null references client_groups(id) on delete cascade,
  chain_depth integer not null check (chain_depth between 1 and 5),
  position integer not null check (position between 1 and 5),
  joining_bonus_amount numeric,
  joining_bonus_enabled boolean default true,
  profit_share_percent numeric,
  profit_share_enabled boolean default true,
  created_by uuid references users(id),
  created_at timestamptz default now(),
  constraint chk_group_override_position check (position <= chain_depth)
);

create index if not exists idx_group_overrides_group on group_commission_overrides(group_id);
create index if not exists idx_group_overrides_lookup on group_commission_overrides(chain_depth, position);

alter table client_groups enable row level security;
alter table client_group_members enable row level security;
alter table group_commission_overrides enable row level security;

drop policy if exists "client_groups_admin_all" on client_groups;
create policy "client_groups_admin_all" on client_groups for all using (is_admin());

drop policy if exists "client_group_members_admin_all" on client_group_members;
create policy "client_group_members_admin_all" on client_group_members for all using (is_admin());

drop policy if exists "group_commission_overrides_admin_all" on group_commission_overrides;
create policy "group_commission_overrides_admin_all" on group_commission_overrides for all using (is_admin());

-- ---------------------------------------------------------------------------
-- Rewrite handle_deposit_approval() to check for a group-level joining
-- bonus override before falling back to the platform-wide
-- commission_config rate. Only the group-override lookup is new here --
-- everything else matches the existing function exactly.
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
  v_group_override_amount numeric;
  v_group_override_enabled boolean;
begin
  if new.status = 'approved' and old.status <> 'approved' then
    select * into v_user from users where id = new.user_id;

    if new.is_plan_upgrade and new.plan_id is not null then
      update users set plan_id = new.plan_id, plan_activated_at = now() where id = new.user_id;
    end if;

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

          -- Group override check: if this specific BENEFICIARY (the
          -- upline member who would receive this commission) belongs to
          -- a group with an override for this exact (chain_depth,
          -- position), that override's values REPLACE the platform-wide
          -- config looked up above.
          select gco.joining_bonus_amount, gco.joining_bonus_enabled
          into v_group_override_amount, v_group_override_enabled
          from group_commission_overrides gco
          join client_group_members gm on gm.group_id = gco.group_id
          where gm.user_id = v_upline_ids[v_position]
            and gco.chain_depth = v_chain_depth
            and gco.position = v_position
          order by gco.created_at desc
          limit 1;

          if v_group_override_amount is not null then
            v_commission_config.joining_bonus_amount := v_group_override_amount;
            v_commission_config.joining_bonus_enabled := coalesce(v_group_override_enabled, true);
          end if;

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
-- Rewrite handle_snapshot_profit_share() with the matching group-override
-- check for profit_share fields.
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
  v_group_override_percent numeric;
  v_group_override_enabled boolean;
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

      select gco.profit_share_percent, gco.profit_share_enabled
      into v_group_override_percent, v_group_override_enabled
      from group_commission_overrides gco
      join client_group_members gm on gm.group_id = gco.group_id
      where gm.user_id = v_upline_ids[v_position]
        and gco.chain_depth = v_chain_depth
        and gco.position = v_position
      order by gco.created_at desc
      limit 1;

      if v_group_override_percent is not null then
        v_commission_config.profit_share_percent := v_group_override_percent;
        v_commission_config.profit_share_enabled := coalesce(v_group_override_enabled, true);
      end if;

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

-- ============================================================================
-- End of migration 008
-- ============================================================================
