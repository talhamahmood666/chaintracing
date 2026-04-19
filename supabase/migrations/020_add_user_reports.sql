-- Community "Report a Scammer" moderated queue
-- Separate from scam_addresses; admin review promotes to scam_addresses

CREATE TABLE IF NOT EXISTS user_reports (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  address       text NOT NULL,
  chain         text NOT NULL,
  category      text NOT NULL DEFAULT 'scam',
  description   text NOT NULL,
  amount_lost_usd numeric,
  tx_hash       text,
  evidence_urls text[] DEFAULT '{}',
  -- auth
  submitted_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  anon_email    text,
  -- moderation
  status        text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected', 'info_requested')),
  admin_note    text,
  reviewed_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at   timestamptz,
  -- promoted
  promoted_to_scam_id uuid,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_reports_status ON user_reports(status);
CREATE INDEX IF NOT EXISTS idx_user_reports_address ON user_reports(address, chain);
CREATE INDEX IF NOT EXISTS idx_user_reports_submitted_by ON user_reports(submitted_by);

ALTER TABLE user_reports ENABLE ROW LEVEL SECURITY;

-- Users can see their own submissions
CREATE POLICY "user_reports_own_read" ON user_reports
  FOR SELECT USING (submitted_by = auth.uid());

-- Authenticated users can insert (anon allowed via service role)
CREATE POLICY "user_reports_insert" ON user_reports
  FOR INSERT WITH CHECK (true);
