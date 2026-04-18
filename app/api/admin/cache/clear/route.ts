import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-admin";
import { clearTraceCache } from "@/lib/trace-cache";
import { SUPPORTED_CHAINS, type Chain } from "@/lib/tracer";

export const dynamic = "force-dynamic";

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");
  const chain = searchParams.get("chain") as Chain | null;

  if (!address) {
    return NextResponse.json({ error: "address query param required" }, { status: 400 });
  }
  if (chain && !SUPPORTED_CHAINS.includes(chain)) {
    return NextResponse.json({ error: `chain must be one of: ${SUPPORTED_CHAINS.join(", ")}` }, { status: 400 });
  }

  const ok = await clearTraceCache(address, chain ?? undefined);
  return NextResponse.json({ cleared: ok, address, chain: chain ?? "all" });
}
