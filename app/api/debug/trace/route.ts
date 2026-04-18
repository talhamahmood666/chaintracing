import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-admin";
import { traceAddress, type Chain, type BfsLogEntry } from "@/lib/tracer";
import { Agent, setGlobalDispatcher } from "undici";

setGlobalDispatcher(new Agent({ connect: { family: 4 } }));

export const maxDuration = 30;

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");
  const chain = (searchParams.get("chain") ?? "eth") as Chain;

  if (!address) return NextResponse.json({ error: "address required" }, { status: 400 });

  const bfsLog: BfsLogEntry[] = [];
  const start = Date.now();

  try {
    const hops = await traceAddress(address, chain, 20, bfsLog);
    return NextResponse.json({
      address,
      chain,
      hopCount: hops.length,
      durationMs: Date.now() - start,
      hops: hops.map(h => ({
        hop: h.hop,
        from: h.from,
        to: h.to,
        value: `${h.value} ${h.token}`,
        txHash: h.txHash,
        timestamp: new Date(h.timestamp * 1000).toISOString(),
        label: h.label,
        isMixer: h.isMixer,
        isSanctioned: h.isSanctioned,
      })),
      bfsLog,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err), bfsLog }, { status: 500 });
  }
}
