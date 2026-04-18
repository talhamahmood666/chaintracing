-- C1: Add discount_applied column to reports table
ALTER TABLE reports ADD COLUMN IF NOT EXISTS discount_applied boolean NOT NULL DEFAULT false;

-- Partial unique index: each user can have at most one discount_applied=true report.
-- This makes the discount claim atomic and prevents the race condition (C3).
-- On concurrent inserts, the second will fail the index and fall back to full price.
CREATE UNIQUE INDEX IF NOT EXISTS reports_one_discount_per_user
  ON reports (user_id)
  WHERE discount_applied = true;

-- H3: Normalize existing scam_addresses to lowercase (one-time fix for mixed-case rows)
UPDATE scam_addresses SET address = lower(address) WHERE address != lower(address);
