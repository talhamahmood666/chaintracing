-- ChainTracing: reports table
-- Run this in your Supabase SQL editor or via `supabase db push`

create extension if not exists "pgcrypto";

create table if not exists reports (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),

  -- Target
  address           text not null,
  chain             text not null,

  -- Customer
  email             text,

  -- Payment (values: pending, paid, failed)
  status            text not null default 'pending',
  plisio_txn_id     text,

  -- Trace data (stored as JSONB so we can query into it if needed)
  hops              jsonb not null default '[]',

  -- Risk
  risk_score        integer not null default 0,
  risk_level        text not null default 'low',
  risk_flags        jsonb not null default '[]',
  risk_summary      text not null default ''
);

-- Index for quick lookup by Plisio transaction ID (used by webhook)
create index if not exists reports_plisio_txn_idx
  on reports (plisio_txn_id)
  where plisio_txn_id is not null;

-- Index for address lookups
create index if not exists reports_address_idx on reports (address);

-- Index for status queries
create index if not exists reports_status_idx on reports (status);

-- Row-level security: reports are private (read via service role only)
alter table reports enable row level security;

-- No public access — all reads/writes go through the service role key server-side
-- If you want users to view their own report by ID without auth, add a policy:
-- create policy "public read by id" on reports
--   for select using (true);
-- (safe because report IDs are UUIDs — not guessable)
create policy "service role full access" on reports
  using (true)
  with check (true);
