import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Link,
  pdf,
} from "@react-pdf/renderer";
import type { Hop, Chain, ClusterResult, TimingFlag } from "./tracer";
import type { RiskFlag } from "./risk";

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 40,
    color: "#1a1a2e",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: "#2563eb",
  },
  brandCol: {
    flexDirection: "column",
  },
  brandName: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "#2563eb",
    letterSpacing: 1,
  },
  brandTagline: {
    fontSize: 9,
    color: "#64748b",
    marginTop: 2,
  },
  metaCol: {
    flexDirection: "column",
    alignItems: "flex-end",
  },
  metaText: {
    fontSize: 8,
    color: "#64748b",
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#1e3a5f",
    marginTop: 18,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  riskBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  riskScore: {
    fontSize: 36,
    fontFamily: "Helvetica-Bold",
    marginRight: 12,
  },
  riskLabel: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
  },
  riskSummary: {
    fontSize: 10,
    color: "#374151",
    lineHeight: 1.6,
    marginBottom: 12,
  },
  flagRow: {
    flexDirection: "row",
    marginBottom: 6,
    padding: 8,
    backgroundColor: "#f8fafc",
    borderRadius: 4,
    borderLeftWidth: 3,
  },
  flagContent: {
    flex: 1,
  },
  flagLabel: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
  },
  flagDesc: {
    fontSize: 9,
    color: "#4b5563",
    lineHeight: 1.5,
  },
  hopTable: {
    marginTop: 8,
  },
  hopHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#1e3a5f",
    padding: 6,
    borderRadius: 4,
    marginBottom: 2,
  },
  hopHeaderCell: {
    color: "#ffffff",
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
  },
  hopRow: {
    flexDirection: "row",
    padding: 6,
    marginBottom: 1,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  hopRowAlt: {
    backgroundColor: "#f8fafc",
  },
  hopCell: {
    fontSize: 8,
    color: "#374151",
  },
  hopCellBold: {
    fontFamily: "Helvetica-Bold",
  },
  cexBadge: {
    backgroundColor: "#dcfce7",
    color: "#166534",
    padding: 2,
    borderRadius: 2,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
  },
  mixerBadge: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
    padding: 2,
    borderRadius: 2,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
  },
  bridgeBadge: {
    backgroundColor: "#ede9fe",
    color: "#5b21b6",
    padding: 2,
    borderRadius: 2,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    marginTop: 2,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 8,
  },
  footerText: {
    fontSize: 8,
    color: "#94a3b8",
  },
  disclaimer: {
    marginTop: 20,
    padding: 12,
    backgroundColor: "#fffbeb",
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: "#f59e0b",
  },
  disclaimerText: {
    fontSize: 8,
    color: "#78350f",
    lineHeight: 1.6,
  },
  methodologyWarning: {
    marginBottom: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: "#f59e0b",
    borderRadius: 4,
    backgroundColor: "#fffbeb",
  },
  methodologyWarningText: {
    fontSize: 8,
    color: "#78350f",
    lineHeight: 1.5,
  },
  addressBox: {
    backgroundColor: "#f0f9ff",
    padding: 10,
    borderRadius: 4,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#2563eb",
  },
  addressLabel: {
    fontSize: 8,
    color: "#64748b",
    marginBottom: 2,
  },
  addressValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#1e3a5f",
    wordBreak: "break-all",
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 4,
    padding: 6,
    backgroundColor: "#f8fafc",
    borderRadius: 3,
  },
  infoLabel: {
    fontSize: 8,
    color: "#64748b",
    width: 100,
  },
  infoValue: {
    fontSize: 8,
    color: "#1e293b",
    flex: 1,
    fontFamily: "Helvetica-Bold",
  },
  // Compliance letter page styles
  letterPage: {
    fontFamily: "Helvetica",
    fontSize: 11,
    paddingTop: 60,
    paddingBottom: 60,
    paddingHorizontal: 60,
    color: "#1a1a2e",
    lineHeight: 1.7,
  },
  letterTitle: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#1e3a5f",
    marginBottom: 4,
  },
  letterSubtitle: {
    fontSize: 10,
    color: "#64748b",
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 12,
  },
  letterBody: {
    fontSize: 11,
    lineHeight: 1.8,
    color: "#1e293b",
    marginBottom: 12,
  },
  letterBold: {
    fontFamily: "Helvetica-Bold",
  },
  letterSignature: {
    marginTop: 32,
    fontSize: 10,
    color: "#64748b",
  },
});

// ─── Color helpers ────────────────────────────────────────────────────────────

function riskColor(level: string): string {
  switch (level) {
    case "critical": return "#dc2626";
    case "high": return "#ea580c";
    case "medium": return "#d97706";
    default: return "#16a34a";
  }
}

function flagBorderColor(severity: string): string {
  switch (severity) {
    case "critical": return "#dc2626";
    case "high": return "#ea580c";
    case "medium": return "#d97706";
    default: return "#2563eb";
  }
}

function shortAddr(addr: string): string {
  if (addr.length <= 14) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
}

function formatTimestamp(ts: number): string {
  return new Date(ts * 1000).toUTCString();
}

function formatGap(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

// ─── Document component ───────────────────────────────────────────────────────

export interface ScamDbMatchEntry {
  address: string;
  category: string;
  source: string;
  confidenceScore: number;
}

export interface PdfReportProps {
  reportId: string;
  address: string;
  chain: Chain;
  hops: Hop[];
  riskScore: number;
  riskLevel: string;
  riskSummary: string;
  riskFlags: RiskFlag[];
  generatedAt: string;
  tier: "quick" | "deep";
  cluster?: ClusterResult;
  timingFlags?: TimingFlag[];
  scamDbMatches?: ScamDbMatchEntry[];
  aiNarrative?: string;
}

export function ChainTracingReport({
  reportId,
  address,
  chain,
  hops,
  riskScore,
  riskLevel,
  riskSummary,
  riskFlags,
  generatedAt,
  tier,
  cluster,
  timingFlags,
  scamDbMatches,
  aiNarrative,
}: PdfReportProps) {
  const cexHop = hops.find((h) => h.label);
  const chainLabel = chain.toUpperCase();
  const bridgeHops = hops.filter((h) => h.isBridge);
  const mixerHops = hops.filter((h) => h.isMixer);

  return (
    <Document
      title={`ChainTracing Report — ${shortAddr(address)}`}
      author="ChainTracing"
      subject="Stolen Funds Trace Report"
    >
      {/* ── Main evidence page ── */}
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brandCol}>
            <Text style={styles.brandName}>ChainTracing</Text>
            <Text style={styles.brandTagline}>
              Stolen Fund Trace Report — {tier === "deep" ? "Deep Trace" : "Quick Scan"} — Confidential
            </Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaText}>Report ID: {reportId}</Text>
            <Text style={styles.metaText}>Generated: {generatedAt}</Text>
            <Text style={styles.metaText}>Chain: {chainLabel}</Text>
            <Text style={styles.metaText}>Tier: {tier === "deep" ? "Deep Trace" : "Quick Scan"}</Text>
          </View>
        </View>

        {/* Target address */}
        <Text style={styles.sectionTitle}>Target Address</Text>
        <View style={styles.addressBox}>
          <Text style={styles.addressLabel}>Address being traced</Text>
          <Text style={styles.addressValue}>{address}</Text>
        </View>

        {/* Risk summary */}
        <Text style={styles.sectionTitle}>Risk Assessment</Text>
        <View style={styles.riskBadge}>
          <Text
            style={[
              styles.riskScore,
              { color: riskColor(riskLevel) },
            ]}
          >
            {riskScore}
          </Text>
          <View>
            <Text
              style={[
                styles.riskLabel,
                { color: riskColor(riskLevel) },
              ]}
            >
              {riskLevel.toUpperCase()} RISK
            </Text>
            <Text style={{ fontSize: 9, color: "#64748b" }}>out of 100</Text>
          </View>
        </View>
        <Text style={styles.riskSummary}>{riskSummary}</Text>

        {/* AI Analyst Summary */}
        {aiNarrative && (
          <>
            <Text style={styles.sectionTitle}>Analyst Summary</Text>
            <View style={{ backgroundColor: "#eff6ff", borderRadius: 4, padding: 10, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: "#2563eb" }}>
              <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: "#2563eb", marginBottom: 4 }}>AI-GENERATED · BLOCKCHAIN FORENSICS ANALYSIS</Text>
              <Text style={{ fontSize: 10, color: "#1e3a5f", lineHeight: 1.6 }}>{aiNarrative}</Text>
            </View>
          </>
        )}

        {/* Methodology warning — single-path BFS disclosure */}
        <View style={styles.methodologyWarning}>
          <Text style={styles.methodologyWarningText}>
            TRACE METHODOLOGY: This report follows the largest outgoing transaction at each hop. Scammers often split funds (peel chains) — if the total stolen amount is over $10,000, consult a professional investigator for multi-path analysis.
          </Text>
          {tier === "deep" && (
            <Text style={[styles.methodologyWarningText, { marginTop: 4 }]}>
              Deep Trace includes bridge + mixer + clustering detection, but still follows single dominant path.
            </Text>
          )}
        </View>

        {/* Flags */}
        {riskFlags.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Risk Flags</Text>
            {riskFlags.map((flag) => (
              <View
                key={flag.id}
                style={[
                  styles.flagRow,
                  { borderLeftColor: flagBorderColor(flag.severity) },
                ]}
              >
                <View style={styles.flagContent}>
                  <Text style={styles.flagLabel}>{flag.label}</Text>
                  <Text style={styles.flagDesc}>{flag.description}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {/* CEX destination */}
        {cexHop && (
          <>
            <Text style={styles.sectionTitle}>Exchange Destination</Text>
            <View
              style={[
                styles.addressBox,
                {
                  backgroundColor: "#f0fdf4",
                  borderLeftColor: "#16a34a",
                },
              ]}
            >
              <Text style={[styles.addressLabel, { color: "#166534" }]}>
                Funds reached: {cexHop.label}
              </Text>
              <Text style={[styles.addressValue, { color: "#14532d" }]}>
                {cexHop.to}
              </Text>
              <Text style={[styles.addressLabel, { marginTop: 4 }]}>
                At hop #{cexHop.hop} — {formatTimestamp(cexHop.timestamp)}
              </Text>
            </View>
          </>
        )}

        {/* Hop table */}
        <Text style={styles.sectionTitle}>
          Transaction Trace ({hops.length} hop{hops.length !== 1 ? "s" : ""})
        </Text>
        <View style={styles.hopTable}>
          <View style={styles.hopHeaderRow}>
            <Text style={[styles.hopHeaderCell, { width: 20 }]}>#</Text>
            <Text style={[styles.hopHeaderCell, { width: 75 }]}>From</Text>
            <Text style={[styles.hopHeaderCell, { width: 75 }]}>To</Text>
            <Text style={[styles.hopHeaderCell, { width: 50 }]}>Amount</Text>
            <Text style={[styles.hopHeaderCell, { width: 55 }]}>Gap</Text>
            <Text style={[styles.hopHeaderCell, { flex: 1 }]}>Time (UTC)</Text>
            <Text style={[styles.hopHeaderCell, { width: 55 }]}>Flags</Text>
          </View>
          {hops.map((hop, i) => (
            <View
              key={hop.txHash}
              style={[
                styles.hopRow,
                i % 2 === 1 ? styles.hopRowAlt : {},
              ]}
            >
              <Text style={[styles.hopCell, { width: 20, fontFamily: "Helvetica-Bold" }]}>
                {hop.hop}
              </Text>
              <Text style={[styles.hopCell, { width: 75 }]}>
                {shortAddr(hop.from)}
              </Text>
              <Text
                style={[
                  styles.hopCell,
                  { width: 75 },
                  hop.label ? styles.hopCellBold : {},
                ]}
              >
                {hop.label ? `${hop.label}` : shortAddr(hop.to)}
              </Text>
              <Text style={[styles.hopCell, { width: 50 }]}>
                {hop.value} {hop.token}
              </Text>
              <Text style={[styles.hopCell, { width: 55, color: "#94a3b8" }]}>
                {hop.gapFromPrevSeconds !== undefined ? formatGap(hop.gapFromPrevSeconds) : "—"}
              </Text>
              <Text style={[styles.hopCell, { flex: 1 }]}>
                {formatTimestamp(hop.timestamp)}
              </Text>
              <View style={{ width: 55 }}>
                {hop.isMixer && (
                  <Text style={styles.mixerBadge}>MIXER</Text>
                )}
                {hop.isSanctioned && (
                  <Text style={styles.mixerBadge}>OFAC</Text>
                )}
                {hop.isBridge && (
                  <Text style={styles.bridgeBadge}>BRIDGE</Text>
                )}
                {hop.label && (
                  <Text style={styles.cexBadge}>CEX</Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Deep-tier: Bridge Activity */}
        {tier === "deep" && bridgeHops.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Bridge Activity Detected</Text>
            {bridgeHops.map((hop) => (
              <View key={`bridge-${hop.txHash}`} style={styles.infoRow}>
                <Text style={styles.infoLabel}>Hop #{hop.hop}</Text>
                <Text style={styles.infoValue}>
                  {hop.bridgeName} — {hop.value} {hop.token} at {formatTimestamp(hop.timestamp)}
                </Text>
              </View>
            ))}
          </>
        )}

        {/* Deep-tier: Mixer Activity */}
        {tier === "deep" && mixerHops.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Mixer / Obfuscation Activity</Text>
            {mixerHops.map((hop) => (
              <View key={`mixer-${hop.txHash}`} style={styles.infoRow}>
                <Text style={styles.infoLabel}>Hop #{hop.hop}</Text>
                <Text style={styles.infoValue}>
                  Funds passed through a known mixer at {formatTimestamp(hop.timestamp)}
                </Text>
              </View>
            ))}
          </>
        )}

        {/* Deep-tier: Wallet Clustering */}
        {tier === "deep" && cluster && cluster.relatedAddresses.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Related Wallet Cluster</Text>
            <View style={styles.addressBox}>
              <Text style={styles.addressLabel}>Seed address</Text>
              <Text style={styles.addressValue}>{cluster.seedAddress}</Text>
            </View>
            {cluster.commonFunder && (
              <View style={[styles.infoRow, { marginBottom: 6 }]}>
                <Text style={styles.infoLabel}>Common funder</Text>
                <Text style={styles.infoValue}>{cluster.commonFunder}</Text>
              </View>
            )}
            <Text style={{ fontSize: 8, color: "#64748b", marginBottom: 4 }}>
              {cluster.relatedAddresses.length} related address{cluster.relatedAddresses.length !== 1 ? "es" : ""} found in trace path:
            </Text>
            {cluster.relatedAddresses.slice(0, 10).map((addr) => (
              <View key={addr} style={styles.infoRow}>
                <Text style={[styles.hopCell, { fontFamily: "Helvetica" }]}>{addr}</Text>
              </View>
            ))}
          </>
        )}

        {/* Deep-tier: Timing Analysis */}
        {tier === "deep" && timingFlags && timingFlags.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Timing Analysis</Text>
            {timingFlags.map((tf, i) => (
              <View key={i} style={[styles.flagRow, { borderLeftColor: "#f59e0b" }]}>
                <View style={styles.flagContent}>
                  <Text style={styles.flagLabel}>Suspicious Gap at Hop #{tf.hopIndex + 1}</Text>
                  <Text style={styles.flagDesc}>{tf.note}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Known Scam Database Matches */}
        {scamDbMatches && scamDbMatches.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Known Scam Database Matches</Text>
            <View style={[styles.infoRow, { marginBottom: 4, backgroundColor: "#fef2f2" }]}>
              <Text style={[styles.infoLabel, { color: "#991b1b" }]}>Address</Text>
              <Text style={[styles.infoLabel, { width: 60, color: "#991b1b" }]}>Category</Text>
              <Text style={[styles.infoLabel, { width: 70, color: "#991b1b" }]}>Source</Text>
              <Text style={[styles.infoLabel, { width: 50, color: "#991b1b" }]}>Confidence</Text>
            </View>
            {scamDbMatches.map((match, i) => (
              <View key={i} style={[styles.infoRow, { marginBottom: 1 }]}>
                <Text style={[styles.hopCell, { flex: 1 }]}>{shortAddr(match.address)}</Text>
                <Text style={[styles.hopCell, { width: 60 }]}>{match.category}</Text>
                <Text style={[styles.hopCell, { width: 70 }]}>{match.source}</Text>
                <Text style={[styles.hopCell, { width: 50 }]}>{match.confidenceScore}%</Text>
              </View>
            ))}
            <View style={[styles.disclaimer, { marginTop: 6, marginBottom: 12 }]}>
              <Text style={styles.disclaimerText}>
                Scam database entries aggregated from public sources (OFAC, community reports).
                ChainTracing does not accuse individuals. Verify independently before acting.
              </Text>
            </View>
          </>
        )}

        {/* Evidence links */}
        <Text style={styles.sectionTitle}>Evidence Links (Block Explorer)</Text>
        {hops.map((hop) => (
          <View key={`link-${hop.txHash}`} style={{ marginBottom: 4 }}>
            <Text style={{ fontSize: 8, color: "#64748b" }}>
              Hop #{hop.hop} —{" "}
              <Link src={hop.explorerUrl} style={{ color: "#2563eb" }}>
                {hop.explorerUrl}
              </Link>
            </Text>
          </View>
        ))}

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            DISCLAIMER: This report is generated automatically from publicly
            available blockchain data. It is intended to assist victims of fraud
            in gathering evidence and is not legal advice. Exchange wallet labels
            are sourced from a community-maintained database and may not be
            exhaustive. Scam database entries aggregated from public sources
            (OFAC, community reports). ChainTracing does not accuse individuals.
            Verify independently before acting. For official proceedings, please
            consult a qualified legal professional and contact your local law
            enforcement agency. ChainTracing does not guarantee the completeness
            or accuracy of this report.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            ChainTracing — {tier === "deep" ? "Deep Trace" : "Quick Scan"} Report
          </Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>

      {/* ── Compliance letter page (deep tier only) ── */}
      {tier === "deep" && (
        <Page size="A4" style={styles.letterPage}>
          <Text style={styles.letterTitle}>Exchange Compliance Request</Text>
          <Text style={styles.letterSubtitle}>
            ChainTracing Deep Trace Report #{reportId} — {generatedAt}
          </Text>

          <Text style={styles.letterBody}>To the Compliance / Fraud Team,</Text>

          <Text style={styles.letterBody}>
            I am writing to report suspected fraudulent activity and to request
            your assistance in freezing or flagging the following wallet
            address(es) associated with stolen cryptocurrency funds.
          </Text>

          <Text style={styles.letterBody}>
            <Text style={styles.letterBold}>Traced Address: </Text>{address}{"\n"}
            <Text style={styles.letterBold}>Network: </Text>{chain.toUpperCase()}{"\n"}
            <Text style={styles.letterBold}>Hops Traced: </Text>{hops.length}{"\n"}
            {cexHop && (
              <>
                <Text style={styles.letterBold}>Destination Address at Your Exchange: </Text>
                {cexHop.to}{"\n"}
                <Text style={styles.letterBold}>Transaction Hash: </Text>
                {cexHop.txHash}{"\n"}
                <Text style={styles.letterBold}>Time of Deposit: </Text>
                {formatTimestamp(cexHop.timestamp)}{"\n"}
              </>
            )}
          </Text>

          <Text style={styles.letterBody}>
            The attached trace report documents the movement of funds from the
            source wallet through {hops.length} intermediate hop{hops.length !== 1 ? "s" : ""} on the{" "}
            {chain.toUpperCase()} blockchain. Each hop includes a block explorer
            link for independent verification.
          </Text>

          {bridgeHops.length > 0 && (
            <Text style={styles.letterBody}>
              Note: funds passed through {bridgeHops.length} cross-chain bridge
              contract{bridgeHops.length !== 1 ? "s" : ""} (
              {bridgeHops.map((h) => h.bridgeName).filter(Boolean).join(", ")}),
              which may require coordination with other chain compliance teams.
            </Text>
          )}

          <Text style={styles.letterBody}>
            I request that you:{"\n"}
            1. Freeze any funds remaining in the destination address pending
            investigation.{"\n"}
            2. Provide the relevant KYC information associated with the
            destination account to law enforcement upon receipt of an official
            request.{"\n"}
            3. Acknowledge receipt of this complaint and provide a reference
            number for follow-up.
          </Text>

          <Text style={styles.letterBody}>
            I have filed / intend to file a report with the relevant law
            enforcement authority and will provide your reference number in that
            filing. Please contact me if you require any additional information.
          </Text>

          <Text style={styles.letterSignature}>
            Report generated by ChainTracing (chaintracing.io){"\n"}
            Report ID: {reportId}{"\n"}
            Generated: {generatedAt}{"\n"}
            {"\n"}
            This letter is provided as a template to assist fraud victims. The
            recipient should complete their own details before submitting to an
            exchange.
          </Text>

          {/* Footer */}
          <View style={styles.footer} fixed>
            <Text style={styles.footerText}>
              ChainTracing — Exchange Compliance Letter
            </Text>
            <Text
              style={styles.footerText}
              render={({ pageNumber, totalPages }) =>
                `Page ${pageNumber} of ${totalPages}`
              }
            />
          </View>
        </Page>
      )}
    </Document>
  );
}

// ─── PDF generation helper (server-side) ─────────────────────────────────────

export async function generatePdfBuffer(props: PdfReportProps): Promise<Buffer> {
  const doc = <ChainTracingReport {...props} />;
  const blob = await pdf(doc).toBlob();
  const arrayBuffer = await blob.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
