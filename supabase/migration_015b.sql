-- ============================================================================
-- Creston Markets — Migration 015b (Part 2 of 2)
-- Adds a real, fully-functional "Custom Bonus" feature: admin can grant
-- an arbitrary bonus amount to any client, for any reason, creating a
-- genuine commission_records row -- not a workaround or a balance
-- adjustment. Shows up correctly in the client's My Earnings page,
-- Admin -> Referral & Earnings, and the activity log, exactly like a
-- real joining bonus or profit share entry, clearly labeled as
-- "Custom Bonus" so it's never confused with an auto-calculated one.
--
-- MUST be run AFTER migration_015.sql has been run and committed as its
-- own separate step (see that file for why).
-- ============================================================================

-- chain_depth and position exist specifically to describe WHERE in a
-- referral chain a real calculated commission sits -- a custom bonus
-- has no chain position at all (it's not calculated from anyone's
-- referral activity), so both need to become genuinely nullable. The
-- existing CHECK constraints (1-5 range) only apply when a value IS
-- present, so real calculated commissions are completely unaffected --
-- this only adds the ability for a custom_bonus row to leave these
-- blank instead of requiring a value that wouldn't mean anything.
alter table commission_records alter column chain_depth drop not null;
alter table commission_records alter column position drop not null;

-- source_user_id represents "whose activity triggered this" -- for a
-- genuinely arbitrary bonus with no triggering activity, this also
-- needs to be nullable rather than forced to some artificial value.
alter table commission_records alter column source_user_id drop not null;

-- A free-text reason, specifically for custom bonuses -- required context
-- for why an arbitrary amount was granted, useful for the activity trail
-- and for the client to understand what this line item actually is.
alter table commission_records add column if not exists custom_reason text;

-- commission_notifications has the identical "chain_depth/position/
-- source_user_id all describe WHERE in a chain this came from" pattern
-- as commission_records, and needs the same nullability fix for the
-- same reason -- a custom bonus notification has no triggering source
-- user or chain position to report.
alter table commission_notifications alter column source_user_id drop not null;
alter table commission_notifications alter column chain_depth drop not null;
alter table commission_notifications alter column position drop not null;

-- ---------------------------------------------------------------------------
-- A dedicated function for creating a custom bonus, rather than a raw
-- insert from the client-side admin form -- this keeps the validation
-- (positive amount, real reason, real beneficiary) enforced centrally
-- and gives a single, auditable path for this specific action, matching
-- the SECURITY DEFINER pattern already used elsewhere in this schema.
-- ---------------------------------------------------------------------------
create or replace function create_custom_bonus(
  p_beneficiary_id uuid,
  p_amount numeric,
  p_reason text,
  p_admin_id uuid
) returns uuid as $$
declare
  v_new_record_id uuid;
begin
  if p_amount <= 0 then
    raise exception 'Custom bonus amount must be greater than zero';
  end if;
  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'A reason is required for a custom bonus';
  end if;
  if not exists (select 1 from users where id = p_beneficiary_id) then
    raise exception 'Beneficiary does not exist';
  end if;
  if not exists (select 1 from users where id = p_admin_id and role = 'admin') then
    raise exception 'Only an admin can grant a custom bonus';
  end if;

  insert into commission_records (
    beneficiary_id, commission_type, base_amount, commission_earned,
    status, custom_reason
  ) values (
    p_beneficiary_id, 'custom_bonus', p_amount, p_amount,
    'pending', p_reason
  )
  returning id into v_new_record_id;

  insert into commission_notifications (
    user_id, commission_record_id, commission_type
  ) values (
    p_beneficiary_id, v_new_record_id, 'custom_bonus'
  );

  insert into admin_audit_log (
    admin_id, action, target_type, target_id, after_value
  ) values (
    p_admin_id, 'commission.custom_bonus_granted', 'users', p_beneficiary_id,
    jsonb_build_object('amount', p_amount, 'reason', p_reason)
  );

  return v_new_record_id;
end;
$$ language plpgsql security definer;

grant execute on function create_custom_bonus(uuid, numeric, text, uuid) to authenticated;

-- ============================================================================
-- End of migration 015b
-- ============================================================================
