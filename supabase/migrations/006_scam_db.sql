-- Scam address database: OFAC SDN, CryptoScamDB, and future sources
CREATE TABLE scam_addresses (
  id uuid primary key default gen_random_uuid(),
  address text not null,
  chain text not null,
  category text not null,
  source text not null,
  source_url text,
  reported_at timestamptz,
  verified boolean not null default false,
  confidence_score integer not null default 50,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Addresses are stored lowercase; unique per (address, chain) pair
CREATE UNIQUE INDEX scam_addr_chain_idx ON scam_addresses (lower(address), chain);
CREATE INDEX scam_category_idx ON scam_addresses (category);

-- RLS: service role only (consistent with other tables)
ALTER TABLE scam_addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON scam_addresses
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
