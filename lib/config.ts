// Environment configuration and validation
// This validates required environment variables at runtime

// Server-side environment variables (not exposed to client)
const serverEnv = {
  // Block explorer APIs
  ETHERSCAN_API_KEY: process.env.ETHERSCAN_API_KEY,
  SOLSCAN_API_KEY: process.env.SOLSCAN_API_KEY,
  TRONGRID_API_KEY: process.env.TRONGRID_API_KEY,
  ANKR_API_KEY: process.env.ANKR_API_KEY ?? "",

  // Payment
  PLISIO_SECRET_KEY: process.env.PLISIO_SECRET_KEY,
  TIER_QUICK_PRICE_USD: process.env.TIER_QUICK_PRICE_USD ?? "9.99",
  TIER_DEEP_PRICE_USD: process.env.TIER_DEEP_PRICE_USD ?? "29.99",

  // Database
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,

  // Optional salt for rate limiting or other purposes
  SCAN_SALT: process.env.SCAN_SALT,
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