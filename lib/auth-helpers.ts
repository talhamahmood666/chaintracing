import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";

/**
 * Create a Supabase server client for use in Server Components, Server Actions,
 * and Route Handlers.
 *
 * Uses the @supabase/ssr package with Next.js App Router cookie management.
 * In Next.js 16+, cookies() is async so this function must be async.
 */
export async function createClient(request?: NextRequest) {
  // Route Handlers: pass the request so createServerClient can set cookies
  // via the response-able setAll callback (needed for Set-Cookie headers).
  if (request) {
    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            // Next.js 16: request.cookies.set does NOT accept options — name + value only
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
          },
        },
      }
    );
  }

  // Server Components / Server Actions: use the async cookie store.
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
            // setAll throws when called from a Server Component during initial
            // render. Middleware handles session refresh instead — safe to ignore.
          }
        },
      },
    }
  );
}

/**
 * Require an authenticated user. Returns null if not authenticated.
 * Use this in route handlers that need a guaranteed user context.
 */
export async function requireUser(request: NextRequest) {
  const supabase = await createClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;
  return { supabase, user };
}

/**
 * Get the current user if available, without blocking on missing auth.
 * Callers can safely use user?.id even when nobody is logged in.
 */
export async function getUser(request: NextRequest) {
  const supabase = await createClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
}