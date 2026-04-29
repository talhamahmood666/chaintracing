import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";
import { getAdminClient } from "@/lib/supabase";
import type { Hop } from "@/lib/tracer";

export const runtime = "edge";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  const { reportId } = await params;

  const db = getAdminClient();
  const { data: report } = await db
    .from("reports")
    .select("address, chain, risk_score, risk_level, hops, status")
    .eq("id", reportId)
    .single();

  const riskScore = report?.risk_score ?? 0;
  const hopCount = Array.isArray(report?.hops) ? report.hops.length : 0;
  const address = report?.address ?? "0x???";
  const redacted = `${address.slice(0, 6)}...${address.slice(-4)}`;
  const chain = (report?.chain ?? "eth").toUpperCase();

  const scoreColor =
    riskScore >= 75 ? "#FF4757" : riskScore >= 50 ? "#FFA500" : riskScore >= 25 ? "#FFD700" : "#00E676";
  const levelText =
    riskScore >= 75 ? "CRITICAL RISK" : riskScore >= 50 ? "HIGH RISK" : riskScore >= 25 ? "MEDIUM RISK" : "LOW RISK";

  // First 3 hops for mini diagram
  const hops: Hop[] = Array.isArray(report?.hops) ? report.hops.slice(0, 3) : [];

  function hopColor(hop: Hop) {
    if (hop?.isSanctioned) return "#FF4757";
    if (hop?.isMixer) return "#FFA500";
    if (hop?.isBridge) return "#9B59B6";
    const label = (hop?.label ?? "").toLowerCase();
    if (label.includes("exchange") || label.includes("binance") || label.includes("coinbase")) return "#00E676";
    return "#00D9FF";
  }

  // Determine destination type for og:description equivalent
  const lastHop = hops[hops.length - 1];
  const destType = lastHop?.isSanctioned
    ? "a sanctioned address"
    : lastHop?.isMixer
    ? "a mixer"
    : lastHop?.isBridge
    ? "a bridge"
    : "an unknown destination";

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "#0A1628",
          display: "flex",
          flexDirection: "column",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Grid overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(0,217,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,217,255,0.04) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Header row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "36px 56px 0",
            position: "relative",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: 5, background: "#00D9FF" }} />
            <span style={{ fontSize: 24, fontWeight: 900, color: "#00D9FF", letterSpacing: 2 }}>
              CHAINTRACING
            </span>
          </div>
          <span style={{ fontSize: 14, color: "rgba(232,244,253,0.35)", letterSpacing: 1 }}>
            chaintracing.org
          </span>
        </div>

        {/* Center content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            flex: 1,
            position: "relative",
            gap: 0,
          }}
        >
          {/* Risk score */}
          <div
            style={{
              fontSize: 128,
              fontWeight: 900,
              color: scoreColor,
              lineHeight: 1,
              textShadow: `0 0 60px ${scoreColor}66`,
            }}
          >
            {riskScore}
          </div>
          <div style={{ fontSize: 13, color: "rgba(232,244,253,0.4)", letterSpacing: 3, marginTop: 4 }}>
            OUT OF 100
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 900,
              color: scoreColor,
              letterSpacing: 4,
              marginTop: 12,
              padding: "6px 20px",
              border: `1px solid ${scoreColor}44`,
              borderRadius: 6,
              background: `${scoreColor}11`,
            }}
          >
            {levelText}
          </div>

          {/* Mini hop chain */}
          {hops.length > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 0,
                marginTop: 40,
              }}
            >
              {/* Origin */}
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  background: "rgba(255,255,255,0.06)",
                  border: "2px solid rgba(0,217,255,0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  color: "#00D9FF",
                  fontWeight: 700,
                }}
              >
                {chain}
              </div>
              {hops.map((hop, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center" }}>
                  <div
                    style={{
                      width: 48,
                      height: 2,
                      background: "rgba(255,255,255,0.12)",
                    }}
                  />
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      background: `${hopColor(hop)}18`,
                      border: `2px solid ${hopColor(hop)}88`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      color: hopColor(hop),
                      fontWeight: 700,
                    }}
                  >
                    {i + 1}
                  </div>
                </div>
              ))}
              {hopCount > 3 && (
                <div style={{ display: "flex", alignItems: "center" }}>
                  <div style={{ width: 48, height: 2, background: "rgba(255,255,255,0.12)" }} />
                  <span style={{ fontSize: 13, color: "rgba(232,244,253,0.35)", fontWeight: 700 }}>
                    +{hopCount - 3} more
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0 56px 36px",
            position: "relative",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 16, color: "rgba(232,244,253,0.6)", fontFamily: "monospace" }}>
              {redacted}
            </span>
            <span style={{ fontSize: 13, color: "rgba(232,244,253,0.35)" }}>
              Traced {hopCount} hop{hopCount !== 1 ? "s" : ""} · {chain}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 14,
              color: "#00D9FF",
              fontWeight: 700,
              letterSpacing: 1,
            }}
          >
            Free stolen crypto tracing →
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
      },
    }
  );
}
