import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { getAdminClient } from "@/lib/supabase";
import { NextRequest } from "next/server";

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
  try {
    const db = getAdminClient();
    const { data } = await db
      .from("admins")
      .select("user_id")
      .eq("user_id", userId)
      .single();
    return !!data;
  } catch {
    return false;
  }
}
