-- Add intent column to reports table to store user intent during trace
ALTER TABLE reports ADD COLUMN IF NOT EXISTS intent text;

-- Create an index on intent for analytics queries
cREATE INDEX IF NOT EXISTS idx_reports_intent ON reports(intent);