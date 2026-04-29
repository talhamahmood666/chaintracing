// Environment configuration and validation
// This validates required environment variables at runtime

// Server-side environment variables (not exposed to client)
const serverEnv = {
  // Block explorer APIs
  ETHERSCAN_API_KEY: process.env.ETHERSCAN_API_KEY,
  SOLSCAN_API_KEY: process.env.SOLSCAN_API_KEY,
  TRONGRID_API_KEY: process.env.TRONGRID_API_KEY,
  ANKR_API_KEY: process.env.ANKR_API_KEY ?? "",
  HELIUS_API_KEY: process.env.HELIUS_API_KEY ?? "",

  // Payment
  PLISIO_SECRET_KEY: process.env.PLISIO_SECRET_KEY,
  TIER_QUICK_PRICE_USD: process.env.TIER_QUICK_PRICE_USD ?? "14.99",
  TIER_DEEP_PRICE_USD: process.env.TIER_DEEP_PRICE_USD ?? "29.99",

  // Database
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,

  // Optional salt for rate limiting or other purposes
  SCAN_SALT: process.env.SCAN_SALT,

  // RPC providers (optional overrides)
  QUICKNODE_BASE_URL: process.env.QUICKNODE_BASE_URL ?? "",
  ALCHEMY_BSC_URL: process.env.ALCHEMY_BSC_URL ?? "",

  // Rate limiting
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL ?? "",
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN ?? "",

  // AI narrative
  AI_GATEWAY_API_KEY: process.env.AI_GATEWAY_API_KEY ?? "",

  // Email (Resend)
  RESEND_API_KEY: process.env.RESEND_API_KEY ?? "",
  RESEND_FROM: process.env.RESEND_FROM ?? "onboarding@resend.dev",
  RESEND_TO: process.env.RESEND_TO ?? "support@chaintracing.org",
  OPERATOR_EMAIL: process.env.OPERATOR_EMAIL ?? "",

  // Cron jobs
  CRON_SECRET: process.env.CRON_SECRET ?? "",

  // Sentry (optional — no-ops gracefully when DSN is empty)
  SENTRY_DSN: process.env.SENTRY_DSN ?? "",
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN ?? "",
  SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN ?? "",
  SENTRY_ORG: process.env.SENTRY_ORG ?? "",
  SENTRY_PROJECT: process.env.SENTRY_PROJECT ?? "",
} as const;

// Public environment variables (exposed to client via NEXT_PUBLIC_ prefix)
const publicEnv = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
} as const;

// Validation function that throws descriptive errors
function validateEnv() {
  const missing: string[] = [];

  // Check required server env vars
  const requiredServer = [
    'ETHERSCAN_API_KEY',
    'SOLSCAN_API_KEY',
    'TRONGRID_API_KEY',
    'PLISIO_SECRET_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ] as const;

  for (const key of requiredServer) {
    if (!serverEnv[key]) {
      missing.push(key);
    }
  }

  // Check required public env vars
  const requiredPublic = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_BASE_URL',
  ] as const;

  for (const key of requiredPublic) {
    if (!publicEnv[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env.local file and ensure all variables are set.\n' +
      'Refer to README.md for setup instructions.'
    );
  }

  // Log success (in development)
  if (process.env.NODE_ENV === 'development') {
    console.log('✓ Environment variables validated');
  }
}

// Run validation immediately when this module is imported
// This will catch missing env vars early in the application lifecycle
validateEnv();

// Type-safe exports
export const env = {
  ...serverEnv,
  ...publicEnv,

  // Helper to check if we're in production
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',

  // Helper to get base URL with fallback
  get baseUrl() {
    return publicEnv.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  },
} as const;