-- ============================================================================
-- Creston Markets — Migration 015 (Part 1 of 2)
-- Adds the new commission_type_enum value needed for the Custom Bonus
-- feature.
--
-- IMPORTANT: this MUST be run as its own separate execution, fully
-- committed, before migration_015b.sql. Postgres does not allow a
-- newly-added enum value (ALTER TYPE ... ADD VALUE) to be referenced
-- by any other statement within the SAME transaction it was added in
-- -- if this file and 015b were combined into one script and run as a
-- single paste, Supabase's SQL Editor would run the whole thing as one
-- transaction and this would fail with "unsafe use of new value".
-- Splitting into two separate Run actions avoids this entirely.
--
-- Run this in Supabase SQL Editor by itself, then run migration_015b.sql
-- as a completely separate step afterward.
-- ============================================================================

alter type commission_type_enum add value if not exists 'custom_bonus';

-- ============================================================================
-- End of migration 015 (Part 1 of 2) -- now run migration_015b.sql separately
-- ============================================================================
