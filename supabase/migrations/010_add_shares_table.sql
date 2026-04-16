-- Create shares table to track when users share anonymized trace results
CREATE TABLE IF NOT EXISTS shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  platform text,  -- e.g. 'reddit', 'twitter', 'telegram'
  txn_hash text,  -- The transaction hash that was shared (anonymized)
  hop_address text,  -- The hop address shown in the share (anonymized)
  shared_text text  -- The full text that was shared
);

-- Create index for analytics: track virality by report
CREATE INDEX IF NOT EXISTS idx_shares_report_id ON shares(report_id);

-- Create index for analytics: track shares over time
CREATE INDEX IF NOT EXISTS idx_shares_created_at ON shares(created_at DESC);

-- Create index for analytics: track shares by platform
CREATE INDEX IF NOT EXISTS idx_shares_platform ON shares(platform);