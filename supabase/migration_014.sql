-- ============================================================================
-- Creston Markets — Migration 014
-- Adds a genuinely admin-editable platform_settings table, starting with
-- WhatsApp/phone contact info -- so the client can change this number
-- themselves from the admin panel without needing a code deploy every
-- time it changes.
--
-- Run this in Supabase SQL Editor after migration_013.sql.
-- ============================================================================

create table if not exists platform_settings (
  key text primary key,
  value text,
  updated_by uuid references users(id),
  updated_at timestamptz default now()
);

alter table platform_settings enable row level security;

-- Anyone (including logged-out visitors) can READ these settings -- this
-- is public contact info shown on the website, not sensitive data.
drop policy if exists "platform_settings_select_public" on platform_settings;
create policy "platform_settings_select_public" on platform_settings for select
  to anon, authenticated
  using (true);

-- Only admins can WRITE.
drop policy if exists "platform_settings_write_admin" on platform_settings;
create policy "platform_settings_write_admin" on platform_settings for all
  using (is_admin())
  with check (is_admin());

-- Seed the initial WhatsApp number as a placeholder -- admin should
-- update this to the real number via Admin -> Settings.
insert into platform_settings (key, value)
values ('whatsapp_number', '')
on conflict (key) do nothing;

-- ============================================================================
-- End of migration 014
-- ============================================================================
