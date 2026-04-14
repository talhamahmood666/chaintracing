import { env } from "./config";

/**
 * Reject cross-origin requests to API routes.
 * Compares the request's Origin header against NEXT_PUBLIC_BASE_URL.
 * Returns a 403 Response on mismatch, or null if the origin is valid.
 *
 * Server-to-server callbacks (e.g. Plisio webhooks) send no Origin header —
 * those routes should NOT use this check.
 */
export function checkOrigin(request: Request): Response | null {
  const origin = request.headers.get("origin");

  // No Origin header = same-origin navigation or non-browser client.
  // Browsers always send Origin on cross-origin POST/fetch requests,
  // so a missing header means this isn't a cross-site attack.
  if (!origin) return null;

  const allowed = env.NEXT_PUBLIC_BASE_URL;
  if (!allowed) return null;

  // Strip trailing slash for comparison
  const normalised = allowed.replace(/\/+$/, "");
  if (origin === normalised) return null;

  return Response.json(
    { error: "Forbidden: cross-origin request" },
    { status: 403 }
  );
}
