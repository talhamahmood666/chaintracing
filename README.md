# ChainTracing

Stolen-fund tracing tool for crypto scam victims. Enter a scammer's wallet address, get a free risk score, and unlock a full hop-by-hop evidence report starting at $9.99 paid in USDT.

## Features

- Free risk scan: score 0-100, flags for mixer use, sanctioned addresses, wallet age
- Full paid report: every hop traced until funds reach a known CEX hot wallet
- PDF evidence report with block explorer links, timestamped
- BFS traversal up to 10 hops across ETH, BSC, Polygon, Arbitrum, Solana, Tron

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in your keys:

```bash
cp .env.example .env.local
```

| Variable | Description |
|---|---|
| `ETHERSCAN_API_KEY` | [etherscan.io/apis](https://etherscan.io/apis) |
| `BSCSCAN_API_KEY` | [bscscan.com/apis](https://bscscan.com/apis) |
| `POLYGONSCAN_API_KEY` | [polygonscan.com/apis](https://polygonscan.com/apis) |
| `ARBISCAN_API_KEY` | [arbiscan.io/apis](https://arbiscan.io/apis) |
| `SOLSCAN_API_KEY` | [pro-api.solscan.io](https://pro-api.solscan.io) |
| `TRONGRID_API_KEY` | [trongrid.io](https://www.trongrid.io) |
| `PLISIO_SECRET_KEY` | See below |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) |
| `NEXT_PUBLIC_BASE_URL` | Your deployment URL (e.g. `https://chaintracing.io`) |

### 3. Plisio payment setup

1. Sign up at [plisio.net](https://plisio.net)
2. Go to **Settings → API** and copy your secret key
3. Add a **USDT (TRC-20)** payout wallet in your Plisio dashboard
4. Paste the key as `PLISIO_SECRET_KEY` in `.env.local`
5. In production, add your webhook URL in Plisio dashboard:
   `https://yourdomain.com/api/webhook`

Plisio sends a POST callback to `/api/webhook` when payment is confirmed. The callback is verified using HMAC-SHA1 of the sorted payload fields against your secret key.

### 4. Supabase database

Run the migrations in order in your [Supabase SQL editor](https://supabase.com/dashboard):

```sql
-- supabase/migrations/001_create_reports.sql  (initial schema)
-- supabase/migrations/002_add_plisio.sql       (Plisio columns)
```

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Architecture

```
app/
  page.tsx                     Landing page — free scan + paywall CTA
  report/[id]/
    page.tsx                   Server component — fetches report from DB
    report-view.tsx            Client component — hop table, PDF download
  api/
    trace/route.ts             POST — free risk score (no hops exposed)
    checkout/route.ts          POST — runs trace, saves to DB, creates Plisio invoice
    webhook/route.ts           POST — Plisio callback, marks report paid
    report/[id]/pdf/route.ts   GET  — generates and streams PDF

lib/
  tracer.ts                    BFS engine (ETH/BSC/Polygon/Arbitrum/Solana/Tron)
  risk.ts                      Risk scorer
  pdf.tsx                      @react-pdf/renderer PDF generator
  supabase.ts                  Supabase client (anon + service role)

data/
  exchange-wallets.json        Known CEX hot wallet addresses
```

## Deployment

Deploy to Vercel, set all environment variables in the Vercel dashboard, and point `NEXT_PUBLIC_BASE_URL` to your production domain.
