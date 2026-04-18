import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { getAdminClient } from "@/lib/supabase";

// L2: In-process admin status cache — avoids a DB round-trip on every request.
// TTL is 5 minutes; on expiry the next call re-queries Supabase.
// This is module-level so it persists across requests within the same worker process.
const ADMIN_CACHE_TTL_MS = 5 * 60 * 1000;
const adminCache = new Map<string, { isAdmin: boolean; expiresAt: number }>();

function getCachedAdmin(userId: string): boolean | null {
  const entry = adminCache.get(userId);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { adminCache.delete(userId); return null; }
  return entry.isAdmin;
}

function setCachedAdmin(userId: string, isAdmin: boolean) {
  adminCache.set(userId, { isAdmin, expiresAt: Date.now() + ADMIN_CACHE_TTL_MS });
}

/**
 * Call at the top of any admin Server Component.
 * Returns the authenticated user if they are in the admins table.
 * Calls notFound() otherwise — 404, not 403, to avoid leaking route existence.
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  const db = getAdminClient();
  const { data } = await db
    .from("admins")
    .select("user_id")
    .eq("user_id", user!.id)
    .single();

  if (!data) notFound();

  return user!;
}

/**
 * Returns true if the currently authenticated user is an admin.
 * For use in Server Components and Route Handlers where you want a boolean
 * rather than a hard 404 on non-admin.
 */
export async function isAdminUser(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const db = getAdminClient();
    const { data } = await db
      .from("admins")
      .select("user_id")
      .eq("user_id", user.id)
      .single();
    return !!data;
  } catch {
    return false;
  }
}

/**
 * Like isAdminUser() but works in Route Handlers where we already have the
 * user id from getUser(request). Avoids a second auth round-trip.
 */
export async function isAdminById(userId: string): Promise<boolean> {
  const cached = getCachedAdmin(userId);
  if (cached !== null) return cached;
  try {
    const db = getAdminClient();
    const { data } = await db
      .from("admins")
      .select("user_id")
      .eq("user_id", userId)
      .single();
    const result = !!data;
    setCachedAdmin(userId, result);
    return result;
  } catch {
    return false;
  }
}
