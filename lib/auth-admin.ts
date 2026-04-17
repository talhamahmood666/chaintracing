import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { getAdminClient } from "@/lib/supabase";

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
