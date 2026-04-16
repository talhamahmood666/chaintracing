import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase client for use in Server Components, Route Handlers, and Server Actions.
 * Reads/writes the auth session via HTTP-only cookies.
 *
 * Does NOT import lib/config.ts — no validateEnv() side-effect.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value }) =>
              cookieStore.set(name, value)
            );
          } catch {
            // setAll is called from Server Components where cookies are read-only.
            // Middleware handles cookie refresh so this is safe to ignore here.
          }
        },
      },
    }
  );
}
