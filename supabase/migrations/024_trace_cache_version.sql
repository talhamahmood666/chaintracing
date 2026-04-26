-- Add tracer_version column for cache invalidation when tracer logic changes.
-- Idempotent: safe to re-run.
ALTER TABLE trace_cache ADD COLUMN IF NOT EXISTS tracer_version text;
CREATE INDEX IF NOT EXISTS idx_trace_cache_version ON trace_cache(tracer_version);
