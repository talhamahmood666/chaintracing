import { NextRequest } from "next/server";
import { getAdminClient } from "@/lib/supabase";
import { getUser } from "@/lib/auth-helpers";
import { rateLimit, rateLimits } from "@/lib/rate-limit";
import { checkOrigin } from "@/lib/origin-check";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const originBlock = checkOrigin(request);
  if (originBlock) return originBlock;

  const limitRes = await rateLimit(request, rateLimits.submitLimit);
  if (limitRes) return limitRes;

  const { user } = await getUser(request);

  let body: { content?: string; author_name?: string; category?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const content = (body.content ?? "").trim();
  if (!content || content.length < 1 || content.length > 1000) {
    return Response.json({ error: "Content must be between 1 and 1000 characters" }, { status: 400 });
  }

  const db = getAdminClient();
  const { error } = await db.from("roadmap_comments").insert({
    user_id: user?.id ?? null,
    author_name: body.author_name?.trim() || null,
    content,
    category: body.category?.trim() || null,
    approved: false,
  });

  if (error) {
    logger.error("Failed to insert roadmap comment", error);
    return Response.json({ error: "Failed to submit comment" }, { status: 500 });
  }

  return Response.json({ message: "Comment submitted for review" }, { status: 201 });
}
