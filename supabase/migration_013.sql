-- ============================================================================
-- Creston Markets — Migration 013
-- Fixes two real, confirmed bugs reported directly by the client:
--
-- BUG 1: a client's plan was only ever auto-assigned on approval if the
-- deposit was specifically flagged as an upgrade (is_plan_upgrade =
-- true). A completely normal FIRST deposit -- client picks Bronze,
-- deposits $200, admin approves -- never set plan_id at all, because
-- that condition simply never matched. Admin had to manually go set
-- the plan afterward every single time. Fixed by also assigning the
-- plan on a normal first-deposit approval, not just on upgrades.
--
-- BUG 2: the Portfolio page's balance is entirely driven by the
-- client's most recent portfolio_snapshots row -- but nothing in the
-- deposit approval flow ever CREATED that first row. A client could
-- deposit $200, have it approved, and still see "$0" on their Portfolio
-- page indefinitely, until admin separately went to Reconciliation and
-- manually entered a starting balance. Fixed by automatically creating
-- an initial (non-settlement, so it doesn't trigger any commission)
-- snapshot using the deposited amount, the moment a first deposit is
-- approved.
--
-- Run this in Supabase SQL Editor after migration_012.sql.
-- ============================================================================

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
  v_config_found boolean;
begin
  if new.status = 'approved' and old.status <> 'approved' then
    select * into v_user from users where id = new.user_id;

    if new.is_plan_upgrade and new.plan_id is not null then
      update users set plan_id = new.plan_id, plan_activated_at = now() where id = new.user_id;
    end if;

    if v_user.account_active_since is null then
      update users set account_active_since = now() where id = new.user_id;
      update deposits set is_first_deposit = true where id = new.id;

      -- BUG 1 FIX: a normal (non-upgrade) first deposit needs to assign
      -- the plan too -- this was previously only handled for upgrades
      -- above. Guarded so it doesn't double-apply if this somehow WAS
      -- also flagged as an upgrade (the branch above already handled
      -- that case).
      if not new.is_plan_upgrade and new.plan_id is not null then
        update users set plan_id = new.plan_id, plan_activated_at = now() where id = new.user_id;
      end if;

      -- BUG 2 FIX: create the client's first portfolio snapshot using
      -- the deposited amount as their starting balance, so Portfolio
      -- immediately shows something real instead of $0 while waiting
      -- for admin to manually enter a reconciliation entry. This is
      -- explicitly NOT a settlement (is_settlement defaults to false),
      -- so it does not trigger any profit-share commission -- there is
      -- no "gain" yet, this is just the starting point.
      insert into portfolio_snapshots (
        user_id, balance, pnl_total, pnl_today, pnl_this_month,
        return_percent, snapshot_date, source, updated_by
      ) values (
        new.user_id, new.amount, 0, 0, 0,
        0, current_date, 'reconciliation', null
      );

      if v_user.referred_by is not null then
        select * into v_config from referral_config order by updated_at desc limit 1;
        insert into referral_bonuses (
          referrer_id, referred_user_id, trigger_type, bonus_amount,
          status, eligible_after
        ) values (
          v_user.referred_by, v_user.id, 'account_maturity',
          coalesce(v_config.bonus_amount, 25), 'pending',
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
          where chain_depth = v_chain_depth and position = v_position and effective_from <= now()
          order by effective_from desc limit 1;

          v_config_found := found;

          select gco.joining_bonus_amount, gco.joining_bonus_enabled
          into v_group_override_amount, v_group_override_enabled
          from group_commission_overrides gco
          join client_group_members gm on gm.group_id = gco.group_id
          where gm.user_id = v_upline_ids[v_position] and gco.chain_depth = v_chain_depth and gco.position = v_position
          order by gco.created_at desc limit 1;

          if v_group_override_amount is not null then
            v_commission_config.joining_bonus_amount := v_group_override_amount;
            v_commission_config.joining_bonus_enabled := coalesce(v_group_override_enabled, true);
          end if;

          if v_config_found and v_commission_config.joining_bonus_enabled and v_commission_config.joining_bonus_amount > 0 then
            insert into commission_records (
              beneficiary_id, source_user_id, chain_depth, position, commission_type,
              bonus_amount_at_time, base_amount, commission_earned, status, source_deposit_id
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

-- ============================================================================
-- End of migration 013
-- ============================================================================
