// Browser-safe environment configuration (only NEXT_PUBLIC_*).
// Does NOT import lib/config.ts — no validateEnv() side-effect, no server-only vars.
// Safe to import from Client Components.

const publicEnv = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
} as const;

export const envBrowser = {
  ...publicEnv,

  get baseUrl() {
    return publicEnv.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  },
} as const;
