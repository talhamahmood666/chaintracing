-- Migration: Add user authentication to reports
-- Run this AFTER supabase/backend/migrations/001-007 are applied.

-- 1. Link reports to auth.users
alter table reports
  add column if not exists user_id uuid references auth.users(id) on delete set null;

-- reports are created before any user is logged in (anonymous scans), so user_id must be nullable.
-- New rows written by /api/trace and /api/checkout will have user_id set when a session exists.

-- 2. Admins table
create table if not exists admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

-- 3. Enable RLS
alter table reports enable row level security;
alter table admins enable row level security;

-- 4. RLS policies on reports
-- 4a. Authenticated users can only read their own reports
create policy "users_read_own_reports"
  on reports for select
  using (auth.uid() = user_id);

-- 4b. Authenticated users can only insert reports linked to themselves
create policy "users_insert_own_reports"
  on reports for insert
  with check (auth.uid() = user_id);

-- 4c. Authenticated users can only update their own reports (e.g. status transitions)
create policy "users_update_own_reports"
  on reports for update
  using (auth.uid() = user_id);

-- 4d. Anonymous reports (user_id IS NULL) remain accessible only via view_token.
--      The application validates view_token server-side in the PDF route, which
--      bypasses RLS (service role is used there). No extra policy needed.

-- 4e. Service role bypasses all RLS by default in Supabase.

-- 5. Admin permissions
-- Admin users get full access to all reports (for support / review workflows).
-- The middleware/admin.ts helper checks membership in the admins table.
-- No separate RLS policy required since admin operations use the service role key
-- or a dedicated admin API route (not exposed to the browser).

-- ═══════════════════════════════════════════════════════════════════════════
-- INSTRUCTIONS AFTER RUNNING THIS MIGRATION
-- ═══════════════════════════════════════════════════════════════════════════
--
-- To grant yourself admin access, insert your own user_id into the admins table.
-- You can find your user_id by:
--   1. Signing in at /login
--   2. Visiting the Supabase Dashboard → Table Editor → auth.users
--   3. Copy your id column value
--   4. Run:
--
--      insert into admins (user_id) values ('<your-uuid-here>');
--
-- ═══════════════════════════════════════════════════════════════════════════