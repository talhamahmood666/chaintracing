ALTER TABLE reports ADD COLUMN IF NOT EXISTS view_token text;
CREATE INDEX IF NOT EXISTS reports_view_token_idx ON reports (view_token) WHERE view_token IS NOT NULL;
