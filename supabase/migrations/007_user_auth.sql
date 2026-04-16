-- User authentication: link reports to auth.users, admin table

-- 1. Add user_id to reports (nullable — anonymous reports keep working)
ALTER TABLE reports ADD COLUMN user_id uuid REFERENCES auth.users(id);
CREATE INDEX reports_user_id_idx ON reports (user_id) WHERE user_id IS NOT NULL;

-- 2. RLS: authenticated users can SELECT their own reports
--    (Service role full-access policy already exists from migration 001)
CREATE POLICY "Users can view own reports" ON reports
  FOR SELECT
  USING (auth.uid() = user_id);

-- 3. Admins table
CREATE TABLE admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id)
);
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON admins
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ─── After running this migration ────────────────────────────────────────────
-- Add yourself as admin (replace with your real UUID from Supabase → Auth → Users):
--   INSERT INTO admins (user_id) VALUES ('your-user-uuid-here');
--
-- Enable Google OAuth in Supabase dashboard:
--   Authentication → Providers → Google → enable, add Client ID + Secret
--   In Google Console, add authorized redirect URI:
--   https://<project-ref>.supabase.co/auth/v1/callback
-- ─────────────────────────────────────────────────────────────────────────────
