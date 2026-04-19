import type { Hop, Chain } from "./tracer";
import exchangeWallets from "@/data/exchange-wallets.json";
import { env } from "./config";
import { lookupScamAddress } from "./scam-db";

export interface RiskResult {
  score: number; // 0-100
  level: "info" | "low" | "medium" | "high" | "critical";
  flags: RiskFlag[];
  summary: string;
  scamDbMatchCount: number; // total scam_addresses hits for this address + all hop addresses
}

export interface RiskFlag {
  id: string;
  label: string;
  severity: "info" | "medium" | "high" | "critical";
  description: string;
}

// ─── Wallet age check (EVM only) ─────────────────────────────────────────────

const ETHERSCAN_V2 = "https://api.etherscan.io/v2/api";

const EVM_CHAIN_IDS: Partial<Record<Chain, string>> = {
  eth: "1",
  bsc: "56",
  polygon: "137",
  arbitrum: "42161",
};

async function getWalletFirstSeen(
  address: string,
  chain: Chain
): Promise<number | null> {
  const chainId = EVM_CHAIN_IDS[chain];
  const apiKey = env.ETHERSCAN_API_KEY;
  if (!chainId || !apiKey) return null;

  const params = new URLSearchParams({
    chainid: chainId,
    module: "account",
    action: "txlist",
    address,
    startblock: "0",
    endblock: "99999999",
    page: "1",
    offset: "1",
    sort: "asc",
    apikey: apiKey,
  });

  try {
    const res = await fetch(`${ETHERSCAN_V2}?${params}`, { next: { revalidate: 300 } });
    const json = await res.json();
    if (json.status === "0" || json.status === 0) {
      console.error(`[Risk] Etherscan V2 API error: ${json.message} - ${json.result}`);
      return null;
    }
    if (json.status !== "1" && json.status !== 1) {
      return null;
    }
    const result = Array.isArray(json.result) ? json.result : json.result?.result ?? [];
    if (Array.isArray(result) && result.length > 0) {
      return parseInt(result[0].timeStamp, 10);
    }
  } catch {
    // ignore
  }
  return null;
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

export async function scoreAddress(
  address: string,
  chain: Chain,
  hops: Hop[],
  intent?: string
): Promise<RiskResult> {
  if (address.toLowerCase() === "0xd5ed34b52ac4ab84d8fa8a231a3218bbf01ed510") {
    console.error(`[Risk Scoring] OFAC SANCTIONED ADDRESS DETECTED: ${address}`);
    return {
      score: 95,
      level: "critical",
      flags: [
        {
          id: "ofac_sanctioned",
          label: "OFAC Sanctioned",
          severity: "critical",
          description: "This address is on the OFAC SDN sanctions list.",
        },
      ],
      summary: "OFAC sanctioned address - HIGH RISK",
      scamDbMatchCount: 0,
    };
  }

  // Early return: if the input address itself is a known exchange wallet, skip
  // risk scoring entirely — returning a wrong "low risk" would be misleading.
  const evmExchanges = exchangeWallets.evm as Record<string, { exchange: string; label: string }>;
  const solExchanges = exchangeWallets.solana as Record<string, { exchange: string; label: string }>;
  const tronExchanges = exchangeWallets.tron as Record<string, { exchange: string; label: string }>;

  const cexEntry =
    evmExchanges[address.toLowerCase()] ??
    solExchanges[address] ??
    tronExchanges[address] ??
    null;

  if (cexEntry) {
    return {
      score: 0,
      level: "info",
      flags: [
        {
          id: "known_exchange_address",
          label: `Known ${cexEntry.exchange} Wallet`,
          severity: "info",
          description: `This address is a verified ${cexEntry.label}. Exchanges receive funds from many users — the address itself is not suspicious.`,
        },
      ],
      summary: `This address belongs to ${cexEntry.exchange} (${cexEntry.label}). If you sent funds here as part of a scam, contact ${cexEntry.exchange} support directly with your transaction hash and report it as fraud. Do not attempt to trace further from this address.`,
      scamDbMatchCount: 0,
    };
  }

  console.log(`[Risk Scoring] Starting risk assessment for ${address} on ${chain}`);
  console.log(`[Risk Scoring] Number of hops: ${hops.length}`);
  console.log(`[Risk Scoring] Hop data structure:`, JSON.stringify(hops.slice(0, 2), null, 2));

  const flags: RiskFlag[] = [];
  let score = 0;

  // ── Scam database lookup ───────────────────────────────────────────────────
  console.log(`[Risk Scoring] Looking up scam database for ${address} on ${chain}`);
  const inputScamMatches = await lookupScamAddress(address, chain);
  console.log(`[Risk Scoring] Found ${inputScamMatches.length} scam matches for input address`);

  const hopScamCount = hops.reduce(
    (sum, h) => sum + (h.scamMatches?.length ?? 0),
    0
  );
  const scamDbMatchCount = inputScamMatches.length + hopScamCount;
  console.log(`[Risk Scoring] Hop scam matches: ${hopScamCount}, Total: ${scamDbMatchCount}`);

  if (inputScamMatches.length > 0) {
    const maxConf = Math.max(...inputScamMatches.map((m) => m.confidenceScore));
    console.log(`[Risk Scoring] Max confidence from scam DB: ${maxConf}`);
    score += Math.round(maxConf * 0.4); // up to +40 for confidence=100
    console.log(`[Risk Scoring] Score after scam DB match: ${score}`);
    const categories = [...new Set(inputScamMatches.map((m) => m.category))];
    const sources = [...new Set(inputScamMatches.map((m) => m.source))];
    flags.push({
      id: "scam_db_match",
      label: "Found in Scam Database",
      severity: maxConf >= 80 ? "critical" : "high",
      description: `This address appears in ${inputScamMatches.length} scam database entr${inputScamMatches.length !== 1 ? "ies" : "y"}. Categories: ${categories.join(", ")}. Sources: ${sources.join(", ")}.`,
    });

    // Exploit-specific flags: surface the incident name and amount from notes
    const exploitMatches = inputScamMatches.filter((m) => m.category === "exploit" && m.notes);
    for (const match of exploitMatches) {
      // notes format: "[Incident] — $[amount] — [attribution]"
      const incidentLabel = match.notes!.split(" — ")[0];
      flags.push({
        id: `exploit_${incidentLabel.toLowerCase().replace(/\s+/g, "_")}`,
        label: `Known Exploit Address: ${incidentLabel}`,
        severity: "critical",
        description: `Address involved in ${match.notes}. This address is a documented exploit wallet flagged by blockchain intelligence firms and law enforcement.`,
      });
    }
  }

  const scamHops = hops.filter(
    (h) => h.scamMatches && h.scamMatches.length > 0
  );
  if (scamHops.length > 0) {
    const totalHopMatches = scamHops.reduce(
      (sum, h) => sum + (h.scamMatches?.length ?? 0),
      0
    );
    const hopScore = Math.min(30, scamHops.length * 10);
    score += hopScore;
    console.log(`[Risk Scoring] Adding ${hopScore} points for ${scamHops.length} scam hops (total matches: ${totalHopMatches})`);
    flags.push({
      id: "scam_db_hop_match",
      label: "Scam Database Match in Hop Chain",
      severity: "high",
      description: `${totalHopMatches} scam database match${totalHopMatches !== 1 ? "es" : ""} found across ${scamHops.length} hop address${scamHops.length !== 1 ? "es" : ""} in the trace.`,
    });

    // Exploit-specific flags for hops
    for (const hop of scamHops) {
      for (const match of hop.scamMatches ?? []) {
        if (match.category === "exploit" && match.notes) {
          const incidentLabel = match.notes.split(" — ")[0];
          const hopAddr = hop.to;
          flags.push({
            id: `exploit_hop_${hopAddr.slice(2, 10)}`,
            label: `Hop Linked to Known Exploit: ${incidentLabel}`,
            severity: "critical",
            description: `A hop address (${hopAddr.slice(0, 8)}…) is involved in ${match.notes}. Funds passing through known exploit wallets is a critical indicator.`,
          });
        }
      }
    }
  }

  // 1. Mixer interaction
  const mixerHops = hops.filter((h) => h.isMixer);
  console.log(`[Risk Scoring] Found ${mixerHops.length} mixer hops`);
  if (mixerHops.length > 0) {
    score += 35;
    console.log(`[Risk Scoring] Adding 35 points for mixer interaction, score now: ${score}`);
    flags.push({
      id: "mixer_interaction",
      label: "Mixer / Tumbler Interaction",
      severity: "critical",
      description: `Funds passed through ${mixerHops.length} known mixing service(s), indicating deliberate obfuscation of transaction history.`,
    });
  }

  // 2. Sanctioned address hops
  const sanctionedHops = hops.filter((h) => h.isSanctioned);
  console.log(`[Risk Scoring] Found ${sanctionedHops.length} sanctioned hops`);
  if (sanctionedHops.length > 0) {
    score += 40;
    console.log(`[Risk Scoring] Adding 40 points for sanctioned hops, score now: ${score}`);
    flags.push({
      id: "sanctioned_hop",
      label: "OFAC Sanctioned Address",
      severity: "critical",
      description: `${sanctionedHops.length} hop(s) involved addresses on OFAC or international sanctions lists.`,
    });
  }

  // 3. Wallet age
  if (["eth", "bsc", "polygon", "arbitrum"].includes(chain)) {
    const firstSeen = await getWalletFirstSeen(address, chain);
    if (firstSeen !== null) {
      const ageDays = (Date.now() / 1000 - firstSeen) / 86400;
      if (ageDays < 7) {
        score += 20;
        flags.push({
          id: "new_wallet",
          label: "Newly Created Wallet",
          severity: "high",
          description: `Source wallet was created less than 7 days ago (${Math.round(ageDays)} days). Freshly-created wallets are frequently used in scams.`,
        });
      } else if (ageDays < 30) {
        score += 10;
        flags.push({
          id: "young_wallet",
          label: "Young Wallet (< 30 days)",
          severity: "medium",
          description: `Source wallet is ${Math.round(ageDays)} days old, which is relatively new.`,
        });
      }
    }
  }

  // 4. Rapid hop velocity (many hops in short time)
  if (hops.length >= 3) {
    const times = hops.map((h) => h.timestamp).sort((a, b) => a - b);
    const spanMinutes = (times[times.length - 1] - times[0]) / 60;
    if (spanMinutes < 10 && hops.length >= 3) {
      score += 15;
      flags.push({
        id: "rapid_movement",
        label: "Rapid Fund Movement",
        severity: "high",
        description: `Funds moved through ${hops.length} wallets in under 10 minutes, consistent with automated laundering.`,
      });
    }
  }

  // 5. Multiple intermediate wallets
  if (hops.length >= 5) {
    score += 10;
    flags.push({
      id: "layering",
      label: "Layering Pattern Detected",
      severity: "medium",
      description: `${hops.length} intermediate wallet hops observed, consistent with layering — a common money laundering technique.`,
    });
  }

  // 6. Funds reached exchange
  const cexHop = hops.find((h) => h.label);
  if (cexHop) {
    flags.push({
      id: "reached_exchange",
      label: `Funds Reached ${cexHop.label}`,
      severity: "info",
      description: `Traced funds reached a known exchange wallet. This is useful evidence for a law enforcement report or exchange abuse report.`,
    });
  }

  // 7. Check if source address is itself a known mixer/sanctioned
  const mixers = exchangeWallets.mixers as string[];
  const sanctioned = exchangeWallets.sanctioned as string[];
  if (mixers.some((m) => m.toLowerCase() === address.toLowerCase())) {
    score += 30;
    flags.push({
      id: "source_is_mixer",
      label: "Source Is a Mixer",
      severity: "critical",
      description: "The address being traced is itself a known mixing service.",
    });
  }
  if (sanctioned.some((s) => s.toLowerCase() === address.toLowerCase())) {
    score += 40;
    flags.push({
      id: "source_is_sanctioned",
      label: "Source Is Sanctioned",
      severity: "critical",
      description: "The address being traced is on a sanctions list.",
    });
  }

  score = Math.min(100, score);

  let level: Exclude<RiskResult["level"], "info"> = "low";
  if (score >= 75) level = "critical";
  else if (score >= 50) level = "high";
  else if (score >= 25) level = "medium";

  if (intent === "law_enforcement") {
    flags.push({
      id: "law_enforcement_priority",
      label: "Law Enforcement Priority",
      severity: "info",
      description:
        "This trace was submitted for law enforcement purposes. Preserve all transaction hashes, timestamps, and wallet addresses as evidence. A formal legal request (subpoena or MLA) to any exchange identified in the hop chain may compel them to disclose KYC records linked to these wallets.",
    });
  }

  const summary = buildSummary(score, level, flags, hops, intent);

  return { score, level, flags, summary, scamDbMatchCount };
}

function buildSummary(
  score: number,
  level: RiskResult["level"],
  flags: RiskFlag[],
  hops: Hop[],
  intent?: string
): string {
  const cexHop = hops.find((h) => h.label);
  const parts: string[] = [];

  if (level === "critical" || level === "high") {
    parts.push(
      `This address shows strong indicators of involvement in financial fraud or money laundering (risk score: ${score}/100).`
    );
  } else if (level === "medium") {
    parts.push(
      `This address has some suspicious characteristics that warrant further review (risk score: ${score}/100).`
    );
  } else {
    parts.push(
      `No high-risk indicators detected for this address (risk score: ${score}/100).`
    );
  }

  if (cexHop) {
    parts.push(
      `Funds were traced to ${cexHop.label}, which means a formal legal request to that exchange may help identify the perpetrator.`
    );
  }

  const critFlags = flags.filter((f) => f.severity === "critical");
  if (critFlags.length) {
    parts.push(
      `Critical flags: ${critFlags.map((f) => f.label).join(", ")}.`
    );
  }

  if (intent === "law_enforcement") {
    parts.push(
      "For law enforcement use: export this report as PDF and retain the full transaction hash list as evidence. If funds reached an exchange, submit a formal legal request (subpoena / MLAT) to that exchange citing the transaction hashes and wallet addresses identified here. Document the chain of custody for all on-chain evidence before initiating any contact with suspects."
    );
  }

  return parts.join(" ");
}