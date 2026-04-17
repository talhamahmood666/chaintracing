ALTER TABLE scam_addresses ADD COLUMN IF NOT EXISTS submitted_by uuid REFERENCES auth.users(id);
ALTER TABLE scam_addresses ADD COLUMN IF NOT EXISTS submission_notes text;
ALTER TABLE scam_addresses ADD COLUMN IF NOT EXISTS tx_evidence text;
ALTER TABLE scam_addresses ADD COLUMN IF NOT EXISTS duplicate_count integer NOT NULL DEFAULT 1;
CREATE INDEX IF NOT EXISTS idx_scam_submitted_by ON scam_addresses(submitted_by);
