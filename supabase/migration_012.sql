-- ============================================================================
-- Creston Markets — Migration 012
-- Adds real support for backdated/corrected reconciliation entries, and
-- fixes a related real bug found while designing this feature.
--
-- REAL BUG FOUND: portfolio_snapshots already has a `snapshot_date`
-- column intended to represent the actual real-world date an entry
-- applies to (separate from `created_at`, which is just when the row
-- was inserted) -- but handle_snapshot_profit_share() was ordering by
-- created_at when looking up the "previous settlement" to calculate
-- profit gain from. This means a backdated correction entered TODAY for
-- a PAST date would have been incorrectly treated as the most recent
-- settlement regardless of which date it actually represents, producing
-- wrong profit-share numbers. Fixed by ordering on snapshot_date
-- instead, with created_at only as a tie-breaker for same-day entries.
--
-- Run this in Supabase SQL Editor after migration_011.sql.
-- ============================================================================

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
  v_config_found boolean;
begin
  if not new.is_settlement then
    return new;
  end if;

  select balance into v_previous_balance
  from portfolio_snapshots
  where user_id = new.user_id
    and id <> new.id
    and is_settlement = true
    and (
      snapshot_date < new.snapshot_date
      or (snapshot_date = new.snapshot_date and created_at < new.created_at)
    )
  order by snapshot_date desc, created_at desc
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
      where chain_depth = v_chain_depth and position = v_position and effective_from <= now()
      order by effective_from desc limit 1;

      v_config_found := found;

      select gco.profit_share_percent, gco.profit_share_enabled
      into v_group_override_percent, v_group_override_enabled
      from group_commission_overrides gco
      join client_group_members gm on gm.group_id = gco.group_id
      where gm.user_id = v_upline_ids[v_position] and gco.chain_depth = v_chain_depth and gco.position = v_position
      order by gco.created_at desc limit 1;

      if v_group_override_percent is not null then
        v_commission_config.profit_share_percent := v_group_override_percent;
        v_commission_config.profit_share_enabled := coalesce(v_group_override_enabled, true);
      end if;

      if v_config_found and v_commission_config.profit_share_enabled and v_commission_config.profit_share_percent > 0 then
        v_commission_amount := round(v_profit_gain * v_commission_config.profit_share_percent / 100, 2);
        if v_commission_amount > 0 then
          insert into commission_records (
            beneficiary_id, source_user_id, chain_depth, position, commission_type,
            rate_at_time, base_amount, commission_earned, status, source_snapshot_id, settlement_period
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

create index if not exists idx_snapshots_user_snapshot_date on portfolio_snapshots(user_id, snapshot_date desc, created_at desc);

-- ============================================================================
-- End of migration 012
-- ============================================================================
