import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/config";

/**
 * Supabase client for use in Server Components, Route Handlers, and Server Actions.
 * Reads/writes the auth session via HTTP-only cookies.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
