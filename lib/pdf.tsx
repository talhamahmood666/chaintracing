import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Link,
  Svg,
  Circle,
  Path,
  pdf,
} from "@react-pdf/renderer";
import type { Hop, Chain, ClusterResult, TimingFlag } from "./tracer";
import type { RiskFlag } from "./risk";

// ─── Color tokens (match web UI) ──────────────────────────────────────────────

const C = {
  navy:       "#0A1628",
  navyMid:    "#1e3a5f",
  navyLight:  "#f0f6ff",
  cyan:       "#00D9FF",
  cyanDim:    "#0099BB",
  green:      "#16a34a",
  greenLight: "#f0fdf4",
  greenBg:    "#dcfce7",
  amber:      "#d97706",
  amberLight: "#fffbeb",
  amberBg:    "#fef3c7",
  orange:     "#ea580c",
  red:        "#dc2626",
  redLight:   "#fef2f2",
  redBg:      "#fee2e2",
  purple:     "#7c3aed",
  purpleBg:   "#ede9fe",
  slate:      "#64748b",
  slateLight: "#f8fafc",
  border:     "#e2e8f0",
  text:       "#1e293b",
  textMuted:  "#64748b",
  white:      "#ffffff",
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    paddingTop: 40,
    paddingBottom: 56,
    paddingHorizontal: 40,
    color: C.text,
    backgroundColor: C.white,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    paddingBottom: 14,
    borderBottomWidth: 3,
    borderBottomColor: C.cyan,
  },
  brandName: { fontSize: 20, fontFamily: "Helvetica-Bold", color: C.navyMid, letterSpacing: 0.5 },
  brandSub:  { fontSize: 8, color: C.slate, marginTop: 3, letterSpacing: 0.3 },
  metaText:  { fontSize: 7.5, color: C.slate, marginBottom: 2, textAlign: "right" },

  // Section titles
  sectionTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: C.slate,
    marginTop: 16,
    marginBottom: 7,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },

  // Risk ring container
  riskRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    marginBottom: 10,
  },
  riskSummaryText: {
    fontSize: 9.5,
    color: C.text,
    lineHeight: 1.65,
    flex: 1,
  },

  // Address box
  addressBox: {
    backgroundColor: C.navyLight,
    padding: 10,
    borderRadius: 5,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: C.cyan,
  },
  addressLabel: { fontSize: 7.5, color: C.slate, marginBottom: 2 },
  addressValue: { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: C.navyMid },

  // Info rows
  infoRow: {
    flexDirection: "row",
    marginBottom: 3,
    padding: 5,
    backgroundColor: C.slateLight,
    borderRadius: 3,
  },
  infoLabel: { fontSize: 8, color: C.slate, width: 100 },
  infoValue:  { fontSize: 8, color: C.text, flex: 1, fontFamily: "Helvetica-Bold" },

  // Flag cards
  flagCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 5,
    padding: 9,
    borderRadius: 5,
    backgroundColor: C.slateLight,
    borderWidth: 1,
  },
  flagDot:     { width: 8, height: 8, borderRadius: 4, marginTop: 1, marginRight: 8, flexShrink: 0 },
  flagLabel:   { fontSize: 9.5, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  flagDesc:    { fontSize: 8.5, color: "#4b5563", lineHeight: 1.5 },

  // Hop chain
  hopCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
    padding: 8,
    borderRadius: 5,
    backgroundColor: C.slateLight,
    borderWidth: 1,
    borderColor: C.border,
  },
  hopBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    flexShrink: 0,
  },
  hopBadgeText: { fontSize: 8, fontFamily: "Helvetica-Bold", color: C.white },
  hopBody: { flex: 1 },
  hopAddresses: { flexDirection: "row", alignItems: "center", marginBottom: 3, flexWrap: "wrap" },
  hopAddr: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: C.navyMid },
  hopArrow: { fontSize: 7.5, color: C.slate, marginHorizontal: 3 },
  hopMeta: { flexDirection: "row", flexWrap: "wrap", gap: 3 },
  hopMetaText: { fontSize: 7.5, color: C.slate },

  // Hop flag pills
  pill: { borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1.5, marginRight: 3 },
  pillText: { fontSize: 7, fontFamily: "Helvetica-Bold" },

  // Exchange attribution card (deep)
  cexCard: {
    backgroundColor: C.greenLight,
    borderRadius: 6,
    padding: 12,
    borderWidth: 2,
    borderColor: C.green,
    marginBottom: 8,
  },
  cexHeader: { fontSize: 8, fontFamily: "Helvetica-Bold", color: C.green, marginBottom: 4, letterSpacing: 0.5 },
  cexName:   { fontSize: 18, fontFamily: "Helvetica-Bold", color: C.navyMid, marginBottom: 3 },
  cexMeta:   { fontSize: 8, color: C.slate, marginBottom: 2 },
  cexConf:   { fontSize: 8, fontFamily: "Helvetica-Bold", color: C.green, marginTop: 4 },

  // Action cards (deep)
  actionCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 5,
    padding: 9,
    borderRadius: 5,
    backgroundColor: C.navyLight,
    borderWidth: 1,
    borderColor: "#c7d9f0",
  },
  actionNum: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: C.navyMid,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    flexShrink: 0,
  },
  actionNumText: { fontSize: 8, fontFamily: "Helvetica-Bold", color: C.white },
  actionTitle:   { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: C.navyMid, marginBottom: 2 },
  actionBody:    { fontSize: 8.5, color: C.text, lineHeight: 1.5 },

  // Hash table (deep)
  hashRow: {
    flexDirection: "row",
    padding: 5,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    alignItems: "center",
  },
  hashText: { fontSize: 7.5, fontFamily: "Helvetica", color: C.navyMid, flex: 1 },
  hashLabel:{ fontSize: 7.5, color: C.slate, width: 40, textAlign: "right" },

  // Warnings
  methodBox: {
    padding: 8,
    borderWidth: 1,
    borderColor: C.amber,
    borderRadius: 4,
    backgroundColor: C.amberLight,
    marginBottom: 10,
  },
  methodText: { fontSize: 7.5, color: "#78350f", lineHeight: 1.5 },

  // AI narrative
  narrativeBox: {
    backgroundColor: "#eff6ff",
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: C.cyan,
  },
  narrativeLabel: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: C.cyanDim, marginBottom: 4, letterSpacing: 0.5 },
  narrativeText:  { fontSize: 9.5, color: C.navyMid, lineHeight: 1.65 },

  // Scam DB
  scamRow: {
    flexDirection: "row",
    padding: 5,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },

  // Disclaimer
  disclaimer: {
    marginTop: 16,
    padding: 10,
    backgroundColor: C.amberLight,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: C.amber,
  },
  disclaimerText: { fontSize: 7.5, color: "#78350f", lineHeight: 1.6 },

  // Footer
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 6,
  },
  footerLeft:  { fontSize: 7, color: C.slate, letterSpacing: 0.3 },
  footerRight: { fontSize: 7, color: C.slate },

  // Compliance letter
  letterPage: {
    fontFamily: "Helvetica",
    fontSize: 11,
    paddingTop: 60,
    paddingBottom: 60,
    paddingHorizontal: 60,
    color: C.text,
    lineHeight: 1.7,
  },
  letterTitle:    { fontSize: 16, fontFamily: "Helvetica-Bold", color: C.navyMid, marginBottom: 4 },
  letterSubtitle: { fontSize: 9.5, color: C.slate, marginBottom: 20, borderBottomWidth: 1, borderBottomColor: C.border, paddingBottom: 12 },
  letterBody:     { fontSize: 10.5, lineHeight: 1.8, color: C.text, marginBottom: 12 },
  letterBold:     { fontFamily: "Helvetica-Bold" },
  letterSig:      { marginTop: 28, fontSize: 9, color: C.slate },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function riskColor(level: string): string {
  switch (level) {
    case "critical": return C.red;
    case "high":     return C.orange;
    case "medium":   return C.amber;
    default:         return C.green;
  }
}

function riskBg(level: string): string {
  switch (level) {
    case "critical": return C.redLight;
    case "high":     return "#fff7ed";
    case "medium":   return C.amberLight;
    default:         return C.greenLight;
  }
}

function flagDotColor(severity: string): string {
  switch (severity) {
    case "critical": return C.red;
    case "high":     return C.orange;
    case "medium":   return C.amber;
    default:         return C.cyan;
  }
}

function flagBorderColor(severity: string): string {
  switch (severity) {
    case "critical": return "#fecaca";
    case "high":     return "#fed7aa";
    case "medium":   return "#fde68a";
    default:         return "#bae6fd";
  }
}

function flagBgColor(severity: string): string {
  switch (severity) {
    case "critical": return C.redLight;
    case "high":     return "#fff7ed";
    case "medium":   return C.amberLight;
    default:         return "#f0f9ff";
  }
}

function shortAddr(addr: string): string {
  if (addr.length <= 16) return addr;
  return `${addr.slice(0, 8)}…${addr.slice(-6)}`;
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

function hopBadgeColor(hop: Hop): string {
  if (hop.isSanctioned) return C.red;
  if (hop.isMixer)      return C.orange;
  if (hop.isBridge)     return C.purple;
  if (hop.label)        return C.green;
  const hasScam = (hop as any).scamMatches?.length > 0;
  if (hasScam)          return C.red;
  return C.navyMid;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Compute SVG arc path from startDeg to endDeg around (cx,cy) with radius r */
function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const toRad = (deg: number) => (deg - 90) * (Math.PI / 180);
  const x1 = cx + r * Math.cos(toRad(startDeg));
  const y1 = cy + r * Math.sin(toRad(startDeg));
  const x2 = cx + r * Math.cos(toRad(endDeg));
  const y2 = cy + r * Math.sin(toRad(endDeg));
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

/** Circular SVG progress ring for risk score */
function RiskRing({ score, level }: { score: number; level: string }) {
  const color = riskColor(level);
  const r = 42;
  const cx = 54;
  const cy = 54;
  const clampedScore = Math.min(Math.max(score, 0), 99.9); // avoid full-circle degenerate arc
  const endDeg = clampedScore * 3.6; // 0–360

  return (
    <View style={{ alignItems: "center", width: 108 }}>
      <Svg width={108} height={108} viewBox="0 0 108 108">
        {/* Track */}
        <Circle cx={cx} cy={cy} r={r} stroke="#e2e8f0" strokeWidth={9} fill="none" />
        {/* Progress arc via Path */}
        <Path
          d={arcPath(cx, cy, r, 0, endDeg)}
          stroke={color}
          strokeWidth={9}
          fill="none"
        />
        {/* Inner filled circle */}
        <Circle cx={cx} cy={cy} r={r - 10} fill={riskBg(level)} />
      </Svg>
      {/* Score overlay */}
      <View style={{ position: "absolute", top: 0, left: 0, width: 108, height: 108, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontSize: 26, fontFamily: "Helvetica-Bold", color, lineHeight: 1 }}>{score}</Text>
        <Text style={{ fontSize: 8, color: C.slate, marginTop: 1 }}>/100</Text>
        <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color, marginTop: 3, letterSpacing: 0.5 }}>
          {level.toUpperCase()}
        </Text>
      </View>
    </View>
  );
}

/** Single risk flag card with colored dot */
function FlagCard({ flag }: { flag: RiskFlag }) {
  return (
    <View style={[s.flagCard, { borderColor: flagBorderColor(flag.severity), backgroundColor: flagBgColor(flag.severity) }]}>
      <View style={[s.flagDot, { backgroundColor: flagDotColor(flag.severity) }]} />
      <View style={{ flex: 1 }}>
        <Text style={[s.flagLabel, { color: flagDotColor(flag.severity) }]}>{flag.label}</Text>
        <Text style={s.flagDesc}>{flag.description}</Text>
      </View>
    </View>
  );
}

/** Hop pill badge */
function Pill({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <View style={[s.pill, { backgroundColor: bg }]}>
      <Text style={[s.pillText, { color }]}>{label}</Text>
    </View>
  );
}

/** Single hop card with numbered badge */
function HopCard({ hop }: { hop: Hop }) {
  const badgeColor = hopBadgeColor(hop);
  const hasScam = (hop as any).scamMatches?.length > 0;

  return (
    <View style={[s.hopCard, hop.isSanctioned || hasScam ? { borderColor: "#fecaca" } : hop.isMixer ? { borderColor: "#fed7aa" } : {}]}>
      <View style={[s.hopBadge, { backgroundColor: badgeColor }]}>
        <Text style={s.hopBadgeText}>{hop.hop}</Text>
      </View>
      <View style={s.hopBody}>
        <View style={s.hopAddresses}>
          <Text style={s.hopAddr}>{shortAddr(hop.from)}</Text>
          <Text style={s.hopArrow}>→</Text>
          <Text style={[s.hopAddr, hop.label ? { color: C.green } : {}]}>
            {hop.label ?? shortAddr(hop.to)}
          </Text>
          <Text style={[s.hopArrow, { marginLeft: 6 }]}>{hop.value} {hop.token}</Text>
        </View>
        <View style={s.hopMeta}>
          <Text style={s.hopMetaText}>{formatTimestamp(hop.timestamp)}</Text>
          {hop.gapFromPrevSeconds !== undefined && (
            <Text style={s.hopMetaText}>· gap: {formatGap(hop.gapFromPrevSeconds)}</Text>
          )}
        </View>
        <View style={[s.hopMeta, { marginTop: 3 }]}>
          {hop.isSanctioned && <Pill label="OFAC SANCTIONED" bg={C.redBg} color={C.red} />}
          {hop.isMixer      && <Pill label="MIXER" bg="#ffedd5" color={C.orange} />}
          {hop.isBridge     && <Pill label="BRIDGE" bg={C.purpleBg} color={C.purple} />}
          {hop.label        && <Pill label={`CEX: ${hop.label}`} bg={C.greenBg} color={C.green} />}
          {hasScam          && <Pill label="SCAM DB MATCH" bg={C.redBg} color={C.red} />}
        </View>
      </View>
    </View>
  );
}

/** Exchange attribution success card */
function CexCard({ hop }: { hop: Hop }) {
  const exchange = hop.label!.split(" Hot Wallet")[0].split(" Cold Wallet")[0].split(":")[0].trim();
  return (
    <View style={s.cexCard}>
      <Text style={s.cexHeader}>🏦  EXCHANGE IDENTIFIED — CONFIDENCE 100%</Text>
      <Text style={s.cexName}>{exchange}</Text>
      <Text style={s.cexMeta}>Wallet: {hop.to}</Text>
      <Text style={s.cexMeta}>Label: {hop.label}</Text>
      <Text style={s.cexMeta}>Arrived at Hop #{hop.hop} · {formatTimestamp(hop.timestamp)}</Text>
      <Text style={s.cexConf}>✓ Funds destination confirmed — formal legal request to {exchange} may compel KYC disclosure</Text>
    </View>
  );
}

/** Recommended action card */
function ActionCard({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <View style={s.actionCard}>
      <View style={s.actionNum}>
        <Text style={s.actionNumText}>{n}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.actionTitle}>{title}</Text>
        <Text style={s.actionBody}>{body}</Text>
      </View>
    </View>
  );
}

// ─── Public types ─────────────────────────────────────────────────────────────

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

// ─── Page footer (fixed) ──────────────────────────────────────────────────────

function PageFooter({ generatedAt, tier }: { generatedAt: string; tier: string }) {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerLeft}>
        CONFIDENTIAL — Generated {generatedAt} · chaintracing.com
      </Text>
      <Text
        style={s.footerRight}
        render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
      />
    </View>
  );
}

// ─── Main report component ────────────────────────────────────────────────────

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
  const cexHop      = hops.find((h) => h.label);
  const chainLabel  = chain.toUpperCase();
  const bridgeHops  = hops.filter((h) => h.isBridge);
  const mixerHops   = hops.filter((h) => h.isMixer);
  const exchange    = cexHop?.label?.split(" Hot Wallet")[0].split(" Cold Wallet")[0].split(":")[0].trim();

  return (
    <Document
      title={`ChainTracing Report — ${shortAddr(address)}`}
      author="ChainTracing"
      subject="Stolen Funds Trace Report"
    >
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/*  Page 1 — Cover / Risk Assessment                                     */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.brandName}>ChainTracing</Text>
            <Text style={s.brandSub}>
              STOLEN FUND TRACE REPORT · {tier === "deep" ? "DEEP TRACE" : "QUICK SCAN"} · CONFIDENTIAL
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={s.metaText}>Report ID: {reportId}</Text>
            <Text style={s.metaText}>Generated: {generatedAt}</Text>
            <Text style={s.metaText}>Chain: {chainLabel}</Text>
            <Text style={s.metaText}>Tier: {tier === "deep" ? "Deep Trace" : "Quick Scan"}</Text>
          </View>
        </View>

        {/* Target address */}
        <Text style={s.sectionTitle}>Target Address</Text>
        <View style={s.addressBox}>
          <Text style={s.addressLabel}>Address being traced</Text>
          <Text style={s.addressValue}>{address}</Text>
          <Text style={[s.addressLabel, { marginTop: 4 }]}>
            {chainLabel} · {hops.length} hop{hops.length !== 1 ? "s" : ""} traced
          </Text>
        </View>

        {/* Risk Assessment — ring + summary */}
        <Text style={s.sectionTitle}>Risk Assessment</Text>
        <View style={s.riskRow}>
          <RiskRing score={riskScore} level={riskLevel} />
          <Text style={s.riskSummaryText}>{riskSummary}</Text>
        </View>

        {/* AI Analyst Summary */}
        {aiNarrative && (
          <>
            <Text style={s.sectionTitle}>Analyst Summary</Text>
            <View style={s.narrativeBox}>
              <Text style={s.narrativeLabel}>AI-GENERATED · BLOCKCHAIN FORENSICS ANALYSIS</Text>
              <Text style={s.narrativeText}>{aiNarrative}</Text>
            </View>
          </>
        )}

        {/* Methodology note */}
        <View style={s.methodBox}>
          <Text style={s.methodText}>
            TRACE METHODOLOGY: Follows the largest outgoing transaction at each hop (single dominant path).
            Scammers often split funds — for amounts over $10,000, consider professional multi-path analysis.
            {tier === "deep" ? " Deep Trace adds bridge, mixer, and clustering detection." : ""}
          </Text>
        </View>

        {/* Risk Flags */}
        {riskFlags.length > 0 && (
          <>
            <Text style={s.sectionTitle}>Risk Flags ({riskFlags.length})</Text>
            {riskFlags.map((flag) => <FlagCard key={flag.id} flag={flag} />)}
          </>
        )}

        <PageFooter generatedAt={generatedAt} tier={tier} />
      </Page>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/*  Page 2 — Hop Chain                                                   */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Text style={s.brandName}>ChainTracing</Text>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={s.metaText}>Report ID: {reportId}</Text>
            <Text style={s.metaText}>Chain: {chainLabel}</Text>
          </View>
        </View>

        <Text style={s.sectionTitle}>
          Transaction Hop Chain — {hops.length} Hop{hops.length !== 1 ? "s" : ""}
        </Text>
        {hops.map((hop) => <HopCard key={hop.txHash} hop={hop} />)}

        {/* Deep: Exchange attribution */}
        {tier === "deep" && cexHop && (
          <>
            <Text style={s.sectionTitle}>Exchange Attribution</Text>
            <CexCard hop={cexHop} />
          </>
        )}

        {/* Quick: simple exchange box */}
        {tier === "quick" && cexHop && (
          <>
            <Text style={s.sectionTitle}>Exchange Destination</Text>
            <View style={[s.addressBox, { backgroundColor: C.greenLight, borderLeftColor: C.green }]}>
              <Text style={[s.addressLabel, { color: C.green }]}>Funds reached: {cexHop.label}</Text>
              <Text style={[s.addressValue, { color: "#14532d" }]}>{cexHop.to}</Text>
              <Text style={[s.addressLabel, { marginTop: 4 }]}>
                Hop #{cexHop.hop} · {formatTimestamp(cexHop.timestamp)}
              </Text>
            </View>
          </>
        )}

        {/* Deep: Recommended actions */}
        {tier === "deep" && (
          <>
            <Text style={s.sectionTitle}>Recommended Actions</Text>
            {cexHop && exchange ? (
              <>
                <ActionCard
                  n={1}
                  title={`File abuse report with ${exchange}`}
                  body={`Submit to ${exchange} compliance/fraud team. Reference wallet ${shortAddr(cexHop.to)} and transaction hash ${shortAddr(cexHop.txHash)}. Most exchanges have an online abuse form.`}
                />
                <ActionCard
                  n={2}
                  title="File a police report"
                  body="Present this PDF to local law enforcement or a cybercrime unit (FBI IC3 at ic3.gov, Action Fraud UK, or equivalent). Include all transaction hashes and wallet addresses. Exchanges respond faster to official requests."
                />
                <ActionCard
                  n={3}
                  title="Submit to IC3 (FBI Internet Crime Complaint Center)"
                  body={`File at ic3.gov. Reference Report ID ${reportId}, all transaction hashes, and the ${exchange} destination wallet. The FBI can issue formal legal requests compelling exchanges to disclose KYC records.`}
                />
              </>
            ) : (
              <>
                <ActionCard n={1} title="File a police report" body="Present this PDF to local law enforcement or a cybercrime unit (FBI IC3 at ic3.gov, Action Fraud UK, or equivalent). Include all transaction hashes." />
                <ActionCard n={2} title="Submit to IC3 (FBI)" body={`File at ic3.gov. Reference Report ID ${reportId} and all transaction hashes listed in the Evidence Links section.`} />
                <ActionCard n={3} title="Consult a blockchain investigator" body="If funds were split (peel chain) or reached a privacy coin, a professional investigator can perform multi-path analysis beyond this single-path trace." />
              </>
            )}
          </>
        )}

        <PageFooter generatedAt={generatedAt} tier={tier} />
      </Page>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/*  Page 3 — Evidence & Deep Analysis                                    */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Text style={s.brandName}>ChainTracing</Text>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={s.metaText}>Report ID: {reportId}</Text>
            <Text style={s.metaText}>Chain: {chainLabel}</Text>
          </View>
        </View>

        {/* Key transaction hashes (deep) */}
        {tier === "deep" && (
          <>
            <Text style={s.sectionTitle}>Key Transaction Hashes</Text>
            <View style={{ borderWidth: 1, borderColor: C.border, borderRadius: 4, marginBottom: 10 }}>
              <View style={[s.hashRow, { backgroundColor: C.navyMid }]}>
                <Text style={[s.hashText, { color: C.white, fontFamily: "Helvetica-Bold" }]}>Transaction Hash</Text>
                <Text style={[s.hashLabel, { color: C.white, fontFamily: "Helvetica-Bold" }]}>Hop</Text>
              </View>
              {hops.map((hop) => (
                <View key={`hash-${hop.txHash}`} style={s.hashRow}>
                  <Text style={s.hashText}>{hop.txHash.slice(0, 48)}…</Text>
                  <Text style={s.hashLabel}>Hop {hop.hop}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Bridge Activity */}
        {tier === "deep" && bridgeHops.length > 0 && (
          <>
            <Text style={s.sectionTitle}>Bridge Activity ({bridgeHops.length} detected)</Text>
            {bridgeHops.map((hop) => (
              <View key={`bridge-${hop.txHash}`} style={s.infoRow}>
                <Text style={s.infoLabel}>Hop #{hop.hop}</Text>
                <Text style={s.infoValue}>{hop.bridgeName} — {hop.value} {hop.token} · {formatTimestamp(hop.timestamp)}</Text>
              </View>
            ))}
          </>
        )}

        {/* Mixer Activity */}
        {tier === "deep" && mixerHops.length > 0 && (
          <>
            <Text style={s.sectionTitle}>Mixer / Obfuscation Activity ({mixerHops.length} detected)</Text>
            {mixerHops.map((hop) => (
              <View key={`mixer-${hop.txHash}`} style={[s.infoRow, { backgroundColor: "#fff7ed" }]}>
                <Text style={s.infoLabel}>Hop #{hop.hop}</Text>
                <Text style={[s.infoValue, { color: C.orange }]}>Funds passed through known mixer · {formatTimestamp(hop.timestamp)}</Text>
              </View>
            ))}
          </>
        )}

        {/* Wallet Clustering */}
        {tier === "deep" && cluster && cluster.relatedAddresses.length > 0 && (
          <>
            <Text style={s.sectionTitle}>Related Wallet Cluster ({cluster.relatedAddresses.length} addresses)</Text>
            <View style={s.addressBox}>
              <Text style={s.addressLabel}>Seed address</Text>
              <Text style={s.addressValue}>{cluster.seedAddress}</Text>
            </View>
            {cluster.commonFunder && (
              <View style={[s.infoRow, { marginBottom: 5 }]}>
                <Text style={s.infoLabel}>Common funder</Text>
                <Text style={s.infoValue}>{cluster.commonFunder}</Text>
              </View>
            )}
            {cluster.relatedAddresses.slice(0, 10).map((addr) => (
              <View key={addr} style={s.infoRow}>
                <Text style={{ fontSize: 8, fontFamily: "Helvetica", color: C.navyMid, flex: 1 }}>{addr}</Text>
              </View>
            ))}
          </>
        )}

        {/* Timing Analysis */}
        {tier === "deep" && timingFlags && timingFlags.length > 0 && (
          <>
            <Text style={s.sectionTitle}>Timing Analysis</Text>
            {timingFlags.map((tf, i) => (
              <View key={i} style={[s.flagCard, { borderColor: "#fde68a", backgroundColor: C.amberLight }]}>
                <View style={[s.flagDot, { backgroundColor: C.amber }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[s.flagLabel, { color: C.amber }]}>Suspicious Gap at Hop #{tf.hopIndex + 1}</Text>
                  <Text style={s.flagDesc}>{tf.note}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Scam DB Matches */}
        {scamDbMatches && scamDbMatches.length > 0 && (
          <>
            <Text style={s.sectionTitle}>Scam Database Matches ({scamDbMatches.length})</Text>
            <View style={{ borderWidth: 1, borderColor: C.border, borderRadius: 4, marginBottom: 8 }}>
              <View style={[s.hashRow, { backgroundColor: C.navyMid }]}>
                <Text style={[{ fontSize: 7.5, fontFamily: "Helvetica-Bold", color: C.white, flex: 2 }]}>Address</Text>
                <Text style={[{ fontSize: 7.5, fontFamily: "Helvetica-Bold", color: C.white, width: 60 }]}>Category</Text>
                <Text style={[{ fontSize: 7.5, fontFamily: "Helvetica-Bold", color: C.white, width: 70 }]}>Source</Text>
                <Text style={[{ fontSize: 7.5, fontFamily: "Helvetica-Bold", color: C.white, width: 50, textAlign: "right" }]}>Confidence</Text>
              </View>
              {scamDbMatches.map((m, i) => (
                <View key={i} style={[s.hashRow, { backgroundColor: i % 2 === 0 ? C.white : C.slateLight }]}>
                  <Text style={{ fontSize: 7.5, color: C.navyMid, flex: 2 }}>{shortAddr(m.address)}</Text>
                  <Text style={{ fontSize: 7.5, color: C.text, width: 60 }}>{m.category}</Text>
                  <Text style={{ fontSize: 7.5, color: C.text, width: 70 }}>{m.source}</Text>
                  <Text style={{ fontSize: 7.5, color: C.red, fontFamily: "Helvetica-Bold", width: 50, textAlign: "right" }}>{m.confidenceScore}%</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Evidence links */}
        <Text style={s.sectionTitle}>Evidence Links (Block Explorer)</Text>
        {hops.map((hop) => (
          <View key={`link-${hop.txHash}`} style={{ marginBottom: 4 }}>
            <Text style={{ fontSize: 7.5, color: C.slate }}>
              Hop #{hop.hop} — {" "}
              <Link src={hop.explorerUrl} style={{ color: C.cyan }}>{hop.explorerUrl}</Link>
            </Text>
          </View>
        ))}

        {/* Disclaimer */}
        <View style={s.disclaimer}>
          <Text style={s.disclaimerText}>
            DISCLAIMER: This report is generated automatically from publicly available blockchain data.
            It is intended to assist victims of fraud in gathering evidence and is not legal advice.
            Exchange wallet labels are sourced from a community-maintained database and may not be exhaustive.
            Scam database entries aggregated from public sources (OFAC, community reports).
            ChainTracing does not accuse individuals. Verify independently before acting.
            For official proceedings, consult a qualified legal professional and your local law enforcement.
          </Text>
        </View>

        <PageFooter generatedAt={generatedAt} tier={tier} />
      </Page>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/*  Page 4 — Compliance Letter (Deep Trace only)                         */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {tier === "deep" && (
        <Page size="A4" style={s.letterPage}>
          <Text style={s.letterTitle}>Exchange Compliance Request</Text>
          <Text style={s.letterSubtitle}>
            ChainTracing Deep Trace Report #{reportId} — {generatedAt}
          </Text>

          <Text style={s.letterBody}>To the Compliance / Fraud Team,</Text>
          <Text style={s.letterBody}>
            I am writing to report suspected fraudulent activity and to request your assistance in
            freezing or flagging the following wallet address(es) associated with stolen cryptocurrency funds.
          </Text>
          <Text style={s.letterBody}>
            <Text style={s.letterBold}>Traced Address: </Text>{address}{"\n"}
            <Text style={s.letterBold}>Network: </Text>{chain.toUpperCase()}{"\n"}
            <Text style={s.letterBold}>Hops Traced: </Text>{hops.length}{"\n"}
            {cexHop ? (
              <>
                <Text style={s.letterBold}>Destination Address at Your Exchange: </Text>{cexHop.to}{"\n"}
                <Text style={s.letterBold}>Transaction Hash: </Text>{cexHop.txHash}{"\n"}
                <Text style={s.letterBold}>Time of Deposit: </Text>{formatTimestamp(cexHop.timestamp)}{"\n"}
              </>
            ) : null}
          </Text>
          <Text style={s.letterBody}>
            The attached trace report documents the movement of funds from the source wallet through{" "}
            {hops.length} intermediate hop{hops.length !== 1 ? "s" : ""} on the {chain.toUpperCase()} blockchain.
            Each hop includes a block explorer link for independent verification.
          </Text>
          {bridgeHops.length > 0 && (
            <Text style={s.letterBody}>
              Note: funds passed through {bridgeHops.length} cross-chain bridge contract{bridgeHops.length !== 1 ? "s" : ""} (
              {bridgeHops.map((h) => h.bridgeName).filter(Boolean).join(", ")}),
              which may require coordination with other chain compliance teams.
            </Text>
          )}
          <Text style={s.letterBody}>
            I request that you:{"\n"}
            1. Freeze any funds remaining in the destination address pending investigation.{"\n"}
            2. Provide the relevant KYC information to law enforcement upon receipt of an official request.{"\n"}
            3. Acknowledge receipt of this complaint and provide a reference number for follow-up.
          </Text>
          <Text style={s.letterBody}>
            I have filed / intend to file a report with the relevant law enforcement authority and will
            provide your reference number in that filing.
          </Text>
          <Text style={s.letterSig}>
            Report generated by ChainTracing (chaintracing.com){"\n"}
            Report ID: {reportId}{"\n"}
            Generated: {generatedAt}{"\n\n"}
            This letter is provided as a template to assist fraud victims.
            Complete your personal details before submitting to an exchange.
          </Text>

          <PageFooter generatedAt={generatedAt} tier={tier} />
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
