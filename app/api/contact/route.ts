import { NextRequest } from "next/server";
import { Resend } from "resend";
import { getAdminClient } from "@/lib/supabase";
import { getUser } from "@/lib/auth-helpers";
import { rateLimit, rateLimits } from "@/lib/rate-limit";
import { checkOrigin } from "@/lib/origin-check";
import { logger } from "@/lib/logger";
import { env } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const originBlock = checkOrigin(request);
  if (originBlock) return originBlock;

  const limitRes = await rateLimit(request, rateLimits.submitLimit);
  if (limitRes) return limitRes;

  const { user } = await getUser(request);

  let body: { name?: string; email?: string; subject?: string; message?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim();
  const subject = (body.subject ?? "").trim();
  const message = (body.message ?? "").trim();

  if (!name || name.length > 100) return Response.json({ error: "Name is required (max 100 chars)" }, { status: 400 });
  if (!email || email.length < 3 || email.length > 200 || !email.includes("@")) {
    return Response.json({ error: "Valid email is required" }, { status: 400 });
  }
  if (!message || message.length > 5000) return Response.json({ error: "Message is required (max 5000 chars)" }, { status: 400 });
  if (subject && subject.length > 200) return Response.json({ error: "Subject too long" }, { status: 400 });

  const db = getAdminClient();
  const { error: dbError } = await db.from("contact_submissions").insert({
    name,
    email,
    subject: subject || null,
    message,
    user_id: user?.id ?? null,
  });

  if (dbError) {
    logger.error("Failed to insert contact submission", dbError);
    return Response.json({ error: "Failed to submit. Please try again." }, { status: 500 });
  }

  // Send email via Resend — non-fatal if it fails
  const apiKey = env.RESEND_API_KEY;
  const from = env.RESEND_FROM;
  const to = env.RESEND_TO;

  if (apiKey) {
    try {
      const resend = new Resend(apiKey);
      await resend.emails.send({
        from,
        to,
        subject: `New contact form submission${subject ? `: ${subject}` : ""}`,
        text: [
          `Name: ${name}`,
          `Email: ${email}`,
          subject ? `Subject: ${subject}` : "",
          "",
          `Message:\n${message}`,
        ].filter(Boolean).join("\n"),
      });
    } catch (e) {
      logger.warn("Resend email failed (non-fatal) for contact form", e);
    }
  }

  return Response.json({ success: true }, { status: 201 });
}
