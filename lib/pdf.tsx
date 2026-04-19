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

// ─── Color tokens ──────────────────────────────────────────────────────────────

const C = {
  navy:       "#0A1628",
  navyMid:    "#1e3a5f",
  navyLight:  "#f0f6ff",
  cyan:       "#00D9FF",
  cyanDim:    "#0099BB",
  green:      "#00C853",
  greenDark:  "#14532d",
  greenLight: "#f0fdf4",
  greenBg:    "#dcfce7",
  amber:      "#d97706",
  amberLight: "#fffbeb",
  orange:     "#FF9500",
  red:        "#FF3B30",
  redLight:   "#fef2f2",
  redBg:      "#fee2e2",
  purple:     "#7c3aed",
  purpleBg:   "#ede9fe",
  slate:      "#64748b",
  slateLight: "#f8f9fa",
  border:     "#e0e0e0",
  text:       "#1e293b",
  textMuted:  "#888888",
  white:      "#ffffff",
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    paddingBottom: 56,
    color: C.text,
    backgroundColor: C.white,
  },

  // Dark navy PDF header bar (matches mockup)
  pdfHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: C.navy,
    borderBottomWidth: 3,
    borderBottomColor: C.cyan,
    marginBottom: 20,
  },
  pdfHeaderLeft:  { flexDirection: "row", alignItems: "center", gap: 10 },
  pdfHeaderBrand: { fontSize: 11, fontFamily: "Helvetica-Bold", color: C.cyan, letterSpacing: 1.2 },
  pdfHeaderSub:   { fontSize: 8, color: "rgba(255,255,255,0.4)", letterSpacing: 0.5 },
  pdfHeaderPage:  { fontSize: 8, color: "rgba(255,255,255,0.4)" },

  // Content area padding
  content: { paddingHorizontal: 24 },

  // Section titles
  sectionTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.textMuted,
    marginTop: 14,
    marginBottom: 7,
    letterSpacing: 0.8,
  },

  // Risk page top row: left meta + right ring
  riskTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  riskMeta: { flex: 1, paddingRight: 12 },
  riskPageLabel: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: C.textMuted, letterSpacing: 0.8, marginBottom: 5 },
  riskTitle: { fontSize: 16, fontFamily: "Helvetica-Bold", color: C.navy, marginBottom: 4 },
  riskSubtitle: { fontSize: 8, color: C.textMuted },

  // Risk level badge under ring
  riskBadge: {
    marginTop: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
    alignSelf: "center",
  },
  riskBadgeText: { fontSize: 8, fontFamily: "Helvetica-Bold", color: C.white, letterSpacing: 0.5 },

  // Flag rows
  flagRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 4,
    backgroundColor: C.slateLight,
    borderWidth: 1,
  },
  flagDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8, flexShrink: 0 },
  flagLabel: { fontSize: 9, fontFamily: "Helvetica-Bold", flex: 1 },

  // Narrative box
  narrativeBox: {
    backgroundColor: "#eff6ff",
    borderRadius: 5,
    padding: 10,
    marginTop: 10,
    borderLeftWidth: 3,
    borderLeftColor: C.cyan,
  },
  narrativeLabel: { fontSize: 7, fontFamily: "Helvetica-Bold", color: C.cyanDim, marginBottom: 4, letterSpacing: 0.8 },
  narrativeText:  { fontSize: 9, color: C.navyMid, lineHeight: 1.65 },

  // Timeline hop row
  hopRow: { flexDirection: "row", alignItems: "stretch", marginBottom: 2 },
  hopSpine: { width: 28, alignItems: "center" },
  hopCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  hopCircleText: { fontSize: 8, fontFamily: "Helvetica-Bold", color: C.white },
  hopLine: { width: 2, flex: 1, backgroundColor: C.border, minHeight: 12 },
  hopContent: { flex: 1, paddingBottom: 12 },
  hopToRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 2 },
  hopToAddr: { fontSize: 9, fontFamily: "Helvetica-Bold", color: C.navy },
  hopTime: { fontSize: 8, color: C.textMuted },
  hopFromRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  hopFromText: { fontSize: 8, color: "#555555" },
  hopFlagText: { fontSize: 8, fontFamily: "Helvetica-Bold" },

  // Exchange card
  cexCard: {
    backgroundColor: C.greenLight,
    borderRadius: 6,
    padding: 14,
    borderWidth: 2,
    borderColor: C.green,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cexIcon: { fontSize: 26, flexShrink: 0 },
  cexBody: { flex: 1 },
  cexHeader: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: C.green, marginBottom: 3, letterSpacing: 0.8 },
  cexName:   { fontSize: 18, fontFamily: "Helvetica-Bold", color: C.navy, marginBottom: 2 },
  cexMeta:   { fontSize: 8, color: C.slate },
  cexRight:  { alignItems: "flex-end", flexShrink: 0 },
  cexConfLabel: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: C.green, letterSpacing: 0.5 },
  cexConfValue: { fontSize: 22, fontFamily: "Helvetica-Bold", color: C.green },

  // Recommended action rows
  actionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 4,
    backgroundColor: C.slateLight,
    borderWidth: 1,
    borderColor: C.border,
  },
  actionNum: { fontSize: 11, fontFamily: "Helvetica-Bold", color: C.cyan, width: 18, flexShrink: 0 },
  actionBody: { flex: 1 },
  actionTitle: { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: C.navy, marginBottom: 2 },
  actionDesc:  { fontSize: 8.5, color: "#666666", lineHeight: 1.5 },

  // Hash table
  hashTableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: C.navy,
  },
  hashTableHeaderText: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: C.white },
  hashRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  hashText:  { fontSize: 7.5, color: "#333333", flex: 1 },
  hashLabel: { fontSize: 7.5, color: C.textMuted, width: 40, textAlign: "right" },

  // Methodology / disclaimer
  methodBox: {
    padding: 8,
    borderWidth: 1,
    borderColor: C.amber,
    borderRadius: 4,
    backgroundColor: C.amberLight,
    marginBottom: 10,
  },
  methodText: { fontSize: 7.5, color: "#78350f", lineHeight: 1.5 },

  disclaimer: {
    marginTop: 12,
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
    bottom: 20,
    left: 24,
    right: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 6,
  },
  footerLeft:  { fontSize: 7, color: C.slate },
  footerRight: { fontSize: 7, color: C.slate },

  // Info rows (for bridge/mixer/cluster)
  infoRow: {
    flexDirection: "row",
    marginBottom: 3,
    padding: 5,
    backgroundColor: C.slateLight,
    borderRadius: 3,
  },
  infoLabel: { fontSize: 8, color: C.slate, width: 80 },
  infoValue:  { fontSize: 8, color: C.text, flex: 1, fontFamily: "Helvetica-Bold" },

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

function shortAddr(addr: string): string {
  if (!addr || addr.length <= 16) return addr ?? "";
  return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
}

function formatTimestamp(ts: number): string {
  return new Date(ts * 1000).toUTCString().replace(" GMT", " UTC");
}

function formatGap(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

function hopCircleColor(hop: Hop): string {
  const hasScam = (hop as any).scamMatches?.length > 0;
  if (hop.isSanctioned || hasScam) return C.red;
  if (hop.isMixer) return C.orange;
  if (hop.label) return C.green;
  return C.navy;
}

function hopFlagLabel(hop: Hop): { text: string; color: string } | null {
  const hasScam = (hop as any).scamMatches?.length > 0;
  if (hop.isSanctioned) return { text: "OFAC Sanctioned", color: C.red };
  if (hasScam)          return { text: "Scam DB match", color: C.red };
  if (hop.isMixer)      return { text: "Mixer / Tumbler", color: C.orange };
  if (hop.isBridge)     return { text: `Bridge: ${hop.bridgeName ?? "detected"}`, color: C.purple };
  if (hop.label)        return { text: "Exchange identified", color: C.green };
  return null;
}

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

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Dark navy PDF header bar — matches mockup exactly */
function PdfHeader({ reportId, chainLabel, page, total }: { reportId: string; chainLabel: string; page?: string; total?: number }) {
  return (
    <View style={s.pdfHeader} fixed>
      <View style={s.pdfHeaderLeft}>
        <Text style={s.pdfHeaderBrand}>CHAINTRACING</Text>
        <Text style={s.pdfHeaderSub}>FORENSIC INTELLIGENCE REPORT</Text>
      </View>
      <Text style={s.pdfHeaderPage} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
    </View>
  );
}

/** Circular SVG progress ring */
function RiskRing({ score, level }: { score: number; level: string }) {
  const color = riskColor(level);
  const r = 42;
  const cx = 54;
  const cy = 54;
  const clamped = Math.min(Math.max(score, 0), 99.9);
  const endDeg = clamped * 3.6;

  return (
    <View style={{ alignItems: "center", width: 108 }}>
      <Svg width={108} height={108} viewBox="0 0 108 108">
        <Circle cx={cx} cy={cy} r={r} stroke="#e0e0e0" strokeWidth={10} fill="none" />
        <Path d={arcPath(cx, cy, r, 0, endDeg)} stroke={color} strokeWidth={10} fill="none" />
        <Circle cx={cx} cy={cy} r={r - 12} fill={riskBg(level)} />
      </Svg>
      <View style={{ position: "absolute", top: 0, left: 0, width: 108, height: 108, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontSize: 26, fontFamily: "Helvetica-Bold", color, lineHeight: 1 }}>{score}</Text>
        <Text style={{ fontSize: 8, color: C.slate, marginTop: 1 }}>/100</Text>
      </View>
      <View style={[s.riskBadge, { backgroundColor: color }]}>
        <Text style={s.riskBadgeText}>{level.toUpperCase()}</Text>
      </View>
    </View>
  );
}

/** Flag row with colored dot */
function FlagRow({ flag }: { flag: RiskFlag }) {
  const dotColor = flagDotColor(flag.severity);
  const borderColor = flagBorderColor(flag.severity);
  return (
    <View style={[s.flagRow, { borderColor }]}>
      <View style={[s.flagDot, { backgroundColor: dotColor }]} />
      <Text style={[s.flagLabel, { color: dotColor }]}>{flag.label}</Text>
    </View>
  );
}

/** Single hop in timeline style */
function HopTimeline({ hop, isLast }: { hop: Hop; isLast: boolean }) {
  const circleColor = hopCircleColor(hop);
  const flag = hopFlagLabel(hop);
  const toLabel = hop.label ?? shortAddr(hop.to);

  return (
    <View style={s.hopRow}>
      {/* Spine: circle + vertical line */}
      <View style={s.hopSpine}>
        <View style={[s.hopCircle, { backgroundColor: circleColor }]}>
          <Text style={s.hopCircleText}>{hop.hop}</Text>
        </View>
        {!isLast && <View style={s.hopLine} />}
      </View>

      {/* Content */}
      <View style={s.hopContent}>
        <View style={s.hopToRow}>
          <Text style={[s.hopToAddr, hop.label ? { color: C.green } : {}]}>{toLabel}</Text>
          <Text style={s.hopTime}>{formatTimestamp(hop.timestamp)}</Text>
        </View>
        <View style={s.hopFromRow}>
          <Text style={s.hopFromText}>
            {hop.value} {hop.token} from {shortAddr(hop.from)}
            {hop.gapFromPrevSeconds != null ? `  +${formatGap(hop.gapFromPrevSeconds)}` : ""}
          </Text>
          {flag && <Text style={[s.hopFlagText, { color: flag.color }]}>{flag.text}</Text>}
        </View>
      </View>
    </View>
  );
}

/** Exchange attribution card — matches mockup green card */
function CexCard({ hop }: { hop: Hop }) {
  const exchange = hop.label!.split(" Hot Wallet")[0].split(" Cold Wallet")[0].split(":")[0].trim();
  return (
    <View style={s.cexCard}>
      <Text style={s.cexIcon}>$</Text>
      <View style={s.cexBody}>
        <Text style={s.cexHeader}>EXCHANGE IDENTIFIED</Text>
        <Text style={s.cexName}>{exchange}</Text>
        <Text style={s.cexMeta}>Wallet: {shortAddr(hop.to)}</Text>
        <Text style={s.cexMeta}>Label: {hop.label}</Text>
        <Text style={s.cexMeta}>Arrived at Hop #{hop.hop} · {formatTimestamp(hop.timestamp)}</Text>
      </View>
      <View style={s.cexRight}>
        <Text style={s.cexConfLabel}>CONFIDENCE</Text>
        <Text style={s.cexConfValue}>100%</Text>
      </View>
    </View>
  );
}

/** Recommended action row */
function ActionRow({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <View style={s.actionRow}>
      <Text style={s.actionNum}>{n}.</Text>
      <View style={s.actionBody}>
        <Text style={s.actionTitle}>{title}</Text>
        <Text style={s.actionDesc}>{desc}</Text>
      </View>
    </View>
  );
}

/** PDF footer bar */
function PageFooter({ generatedAt }: { generatedAt: string }) {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerLeft}>CONFIDENTIAL — Generated {generatedAt} · chaintracing.com</Text>
      <Text style={s.footerRight} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
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

// ─── Main report ──────────────────────────────────────────────────────────────

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
  const cexHop     = hops.find((h) => h.label);
  const chainLabel = chain.toUpperCase();
  const bridgeHops = hops.filter((h) => h.isBridge);
  const mixerHops  = hops.filter((h) => h.isMixer);
  const exchange   = cexHop?.label?.split(" Hot Wallet")[0].split(" Cold Wallet")[0].split(":")[0].trim();

  return (
    <Document
      title={`ChainTracing Report — ${shortAddr(address)}`}
      author="ChainTracing"
      subject="Stolen Funds Trace Report"
    >
      {/* ══ Page 1 — Risk Assessment ══════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <PdfHeader reportId={reportId} chainLabel={chainLabel} />

        <View style={s.content}>
          {/* Top row: left meta + right risk ring */}
          <View style={s.riskTopRow}>
            <View style={s.riskMeta}>
              <Text style={s.riskPageLabel}>RISK ASSESSMENT SUMMARY</Text>
              <Text style={s.riskTitle}>Address: {shortAddr(address)}</Text>
              <Text style={s.riskSubtitle}>
                Chain: {chainLabel} · Scan type: {tier === "deep" ? "Deep Trace" : "Quick Scan"} · Depth: {hops.length} hops
              </Text>
              <Text style={[s.riskSubtitle, { marginTop: 3 }]}>Report ID: {reportId}</Text>
            </View>
            <RiskRing score={riskScore} level={riskLevel} />
          </View>

          {/* Risk flags */}
          {riskFlags.length > 0 && (
            <>
              <Text style={s.sectionTitle}>RISK FLAGS ({riskFlags.length})</Text>
              {riskFlags.map((flag) => <FlagRow key={flag.id} flag={flag} />)}
            </>
          )}

          {/* Risk summary paragraph */}
          <Text style={[s.sectionTitle, { marginTop: 12 }]}>RISK SUMMARY</Text>
          <Text style={{ fontSize: 9.5, color: "#555555", lineHeight: 1.65 }}>{riskSummary}</Text>

          {/* AI narrative */}
          {aiNarrative && (
            <>
              <Text style={[s.sectionTitle, { marginTop: 12 }]}>ANALYST SUMMARY</Text>
              <View style={s.narrativeBox}>
                <Text style={s.narrativeLabel}>AI-GENERATED · BLOCKCHAIN FORENSICS ANALYSIS</Text>
                <Text style={s.narrativeText}>{aiNarrative}</Text>
              </View>
            </>
          )}

          {/* Methodology note */}
          <View style={[s.methodBox, { marginTop: 12 }]}>
            <Text style={s.methodText}>
              TRACE METHODOLOGY: Follows the largest outgoing transaction at each hop (single dominant path).
              Scammers often split funds — for amounts over $10,000, consider professional multi-path analysis.
              {tier === "deep" ? " Deep Trace adds bridge, mixer, and clustering detection." : ""}
            </Text>
          </View>
        </View>

        <PageFooter generatedAt={generatedAt} />
      </Page>

      {/* ══ Page 2 — Hop Chain ════════════════════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <PdfHeader reportId={reportId} chainLabel={chainLabel} />

        <View style={s.content}>
          <Text style={s.sectionTitle}>HOP CHAIN VISUALIZATION — FULL TRANSACTION PATH</Text>
          {hops.map((hop, i) => (
            <HopTimeline key={hop.txHash ?? i} hop={hop} isLast={i === hops.length - 1} />
          ))}
        </View>

        <PageFooter generatedAt={generatedAt} />
      </Page>

      {/* ══ Page 3 — Exchange Attribution & Law Enforcement ══════════════════ */}
      <Page size="A4" style={s.page}>
        <PdfHeader reportId={reportId} chainLabel={chainLabel} />

        <View style={s.content}>
          <Text style={s.sectionTitle}>EXCHANGE ATTRIBUTION &amp; LAW ENFORCEMENT GUIDANCE</Text>

          {/* Exchange card */}
          {cexHop ? (
            <CexCard hop={cexHop} />
          ) : (
            <View style={[s.methodBox, { borderColor: C.slate, backgroundColor: C.slateLight }]}>
              <Text style={[s.methodText, { color: C.slate }]}>
                No confirmed exchange destination detected within {hops.length} hops.
                Funds may have been split or sent to a non-labeled wallet.
              </Text>
            </View>
          )}

          {/* Recommended actions */}
          <Text style={[s.sectionTitle, { marginTop: 10 }]}>RECOMMENDED ACTIONS</Text>
          {cexHop && exchange ? (
            <>
              <ActionRow
                n={1}
                title={`File abuse report with ${exchange}`}
                desc={`Submit to ${exchange} compliance/fraud team. Reference wallet ${shortAddr(cexHop.to)} and transaction hash ${shortAddr(cexHop.txHash)}. Most exchanges have an online abuse form.`}
              />
              <ActionRow
                n={2}
                title="File a police report"
                desc="Present this PDF to local law enforcement or a cybercrime unit (FBI IC3, Action Fraud UK, or equivalent). Include all transaction hashes and wallet addresses."
              />
              <ActionRow
                n={3}
                title="Submit to IC3 (FBI Internet Crime Complaint Center)"
                desc={`File at ic3.gov. Reference Report ID ${reportId}, all transaction hashes, and the ${exchange} destination wallet. The FBI can issue formal requests compelling exchanges to disclose KYC records.`}
              />
            </>
          ) : (
            <>
              <ActionRow n={1} title="File a police report" desc="Present this PDF to local law enforcement or a cybercrime unit (FBI IC3 at ic3.gov, Action Fraud UK, or equivalent). Include all transaction hashes." />
              <ActionRow n={2} title="Submit to IC3 (FBI)" desc={`File at ic3.gov. Reference Report ID ${reportId} and all transaction hashes listed below.`} />
              <ActionRow n={3} title="Consult a blockchain investigator" desc="If funds were split or reached a privacy coin, a professional investigator can perform multi-path analysis beyond this single-path trace." />
            </>
          )}

          {/* Key transaction hashes */}
          <Text style={[s.sectionTitle, { marginTop: 12 }]}>KEY TRANSACTION HASHES (include in all reports)</Text>
          <View style={{ borderWidth: 1, borderColor: C.border, borderRadius: 4, overflow: "hidden" }}>
            <View style={s.hashTableHeader}>
              <Text style={s.hashTableHeaderText}>Transaction Hash</Text>
              <Text style={s.hashTableHeaderText}>Hop</Text>
            </View>
            {hops.map((hop, i) => (
              <View key={`hash-${hop.txHash ?? i}`} style={[s.hashRow, { backgroundColor: i % 2 === 0 ? C.white : C.slateLight }]}>
                <Text style={s.hashText}>{hop.txHash ? `${hop.txHash.slice(0, 48)}...` : "N/A"}</Text>
                <Text style={s.hashLabel}>Hop {hop.hop}</Text>
              </View>
            ))}
          </View>
        </View>

        <PageFooter generatedAt={generatedAt} />
      </Page>

      {/* ══ Page 4 — Evidence & Deep Analysis ════════════════════════════════ */}
      <Page size="A4" style={s.page}>
        <PdfHeader reportId={reportId} chainLabel={chainLabel} />

        <View style={s.content}>
          {/* Bridge Activity */}
          {tier === "deep" && bridgeHops.length > 0 && (
            <>
              <Text style={s.sectionTitle}>BRIDGE ACTIVITY ({bridgeHops.length} DETECTED)</Text>
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
              <Text style={s.sectionTitle}>MIXER / OBFUSCATION ACTIVITY ({mixerHops.length} DETECTED)</Text>
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
              <Text style={s.sectionTitle}>RELATED WALLET CLUSTER ({cluster.relatedAddresses.length} ADDRESSES)</Text>
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
                  <Text style={{ fontSize: 8, color: C.navyMid, flex: 1 }}>{addr}</Text>
                </View>
              ))}
            </>
          )}

          {/* Timing Analysis */}
          {tier === "deep" && timingFlags && timingFlags.length > 0 && (
            <>
              <Text style={s.sectionTitle}>TIMING ANALYSIS</Text>
              {timingFlags.map((tf, i) => (
                <View key={i} style={[s.flagRow, { borderColor: "#fde68a", backgroundColor: C.amberLight }]}>
                  <View style={[s.flagDot, { backgroundColor: C.amber }]} />
                  <Text style={[s.flagLabel, { color: C.amber }]}>
                    Suspicious Gap at Hop #{tf.hopIndex + 1} — {tf.note}
                  </Text>
                </View>
              ))}
            </>
          )}

          {/* Scam DB Matches */}
          {scamDbMatches && scamDbMatches.length > 0 && (
            <>
              <Text style={s.sectionTitle}>SCAM DATABASE MATCHES ({scamDbMatches.length})</Text>
              <View style={{ borderWidth: 1, borderColor: C.border, borderRadius: 4, overflow: "hidden", marginBottom: 8 }}>
                <View style={s.hashTableHeader}>
                  <Text style={[s.hashTableHeaderText, { flex: 2 }]}>Address</Text>
                  <Text style={[s.hashTableHeaderText, { width: 60 }]}>Category</Text>
                  <Text style={[s.hashTableHeaderText, { width: 70 }]}>Source</Text>
                  <Text style={[s.hashTableHeaderText, { width: 50, textAlign: "right" }]}>Confidence</Text>
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
          <Text style={s.sectionTitle}>EVIDENCE LINKS (BLOCK EXPLORER)</Text>
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
        </View>

        <PageFooter generatedAt={generatedAt} />
      </Page>

      {/* ══ Page 5 — Compliance Letter (Deep only) ═══════════════════════════ */}
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
                <Text style={s.letterBold}>Destination Address: </Text>{cexHop.to}{"\n"}
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

          <PageFooter generatedAt={generatedAt} />
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
