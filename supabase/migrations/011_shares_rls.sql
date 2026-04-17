-- Enable RLS on shares table and add access policies
ALTER TABLE shares ENABLE ROW LEVEL SECURITY;

-- Service role gets full access (used by all server-side API routes)
CREATE POLICY "service_role_full_access" ON shares
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Authenticated and anonymous users can INSERT only, if the referenced report exists.
-- No SELECT policy — shares are write-only from client.
CREATE POLICY "insert_if_report_exists" ON shares
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM reports WHERE reports.id = shares.report_id
    )
  );
