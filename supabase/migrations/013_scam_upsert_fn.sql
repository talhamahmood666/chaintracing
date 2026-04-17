-- Batch upsert function with GREATEST confidence_score merge.
-- Accepts a JSONB array of scam_address rows and inserts them,
-- updating confidence_score to the higher value on conflict.
CREATE OR REPLACE FUNCTION upsert_scam_addresses_batch(rows jsonb)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  inserted int;
BEGIN
  INSERT INTO scam_addresses (
    address, chain, category, source, source_url,
    verified, confidence_score, notes, reported_at
  )
  SELECT
    lower(r->>'address'),
    r->>'chain',
    r->>'category',
    r->>'source',
    r->>'source_url',
    (r->>'verified')::boolean,
    (r->>'confidence_score')::int,
    r->>'notes',
    CASE WHEN r->>'reported_at' IS NOT NULL
         THEN (r->>'reported_at')::timestamptz
         ELSE NULL END
  FROM jsonb_array_elements(rows) r
  WHERE r->>'address' IS NOT NULL AND r->>'chain' IS NOT NULL
  ON CONFLICT (lower(address), chain) DO UPDATE SET
    confidence_score = GREATEST(
      scam_addresses.confidence_score,
      EXCLUDED.confidence_score
    ),
    verified        = scam_addresses.verified OR EXCLUDED.verified,
    updated_at      = now();

  GET DIAGNOSTICS inserted = ROW_COUNT;
  RETURN inserted;
END;
$$;
