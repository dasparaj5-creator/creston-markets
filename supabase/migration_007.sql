-- ============================================================================
-- Creston Markets — Migration 007
-- Adds support for "upgrade your plan by paying the difference".
-- Run this in Supabase SQL Editor after migration_006.sql.
-- ============================================================================

alter table deposits add column if not exists is_plan_upgrade boolean default false;
alter table deposits add column if not exists upgrade_from_plan_id uuid references plans(id);

-- Rewrite handle_deposit_approval() to also apply the new plan immediately
-- when an upgrade-tagged deposit is approved, independent of the
-- first-deposit/joining-bonus logic (an upgrade can happen at any point
-- in a client's lifecycle, not just on their very first deposit).
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

-- ============================================================================
-- End of migration 007
-- ============================================================================
