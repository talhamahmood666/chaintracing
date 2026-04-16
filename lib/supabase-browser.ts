import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for use in Client Components.
 * createBrowserClient caches the instance automatically — safe to call repeatedly.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
