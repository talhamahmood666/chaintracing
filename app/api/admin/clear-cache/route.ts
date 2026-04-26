import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-admin";
import { clearTraceCache, clearAllTraceCache } from "@/lib/trace-cache";
import { SUPPORTED_CHAINS, type Chain } from "@/lib/tracer";

export const dynamic = "force-dynamic";

interface Body {
  address?: string;
  chain?: Chain;
  all?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: Body = {};
  try { body = (await request.json()) as Body; } catch { /* empty body */ }

  if (body.all === true) {
    const ok = await clearAllTraceCache();
    return NextResponse.json({ cleared: ok, scope: "all" });
  }

  if (!body.address) {
    return NextResponse.json({ error: "address required (or pass { all: true })" }, { status: 400 });
  }
  if (body.chain && !SUPPORTED_CHAINS.includes(body.chain)) {
    return NextResponse.json({ error: `chain must be one of: ${SUPPORTED_CHAINS.join(", ")}` }, { status: 400 });
  }

  const ok = await clearTraceCache(body.address, body.chain);
  return NextResponse.json({ cleared: ok, address: body.address, chain: body.chain ?? "all" });
}
