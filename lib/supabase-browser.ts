import { createBrowserClient } from "@supabase/ssr";
import { envBrowser } from "@/lib/env-browser";

/**
 * Supabase client for use in Client Components.
 * createBrowserClient caches the instance automatically — safe to call repeatedly.
 */
export function createClient() {
  return createBrowserClient(
    envBrowser.NEXT_PUBLIC_SUPABASE_URL!,
    envBrowser.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
