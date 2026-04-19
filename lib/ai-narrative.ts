import { generateText } from "ai";
import { gateway } from "@ai-sdk/gateway";

export interface NarrativeInput {
  address: string;
  chain: string;
  hop_count: number;
  first_hop_time: string | null;
  last_hop_time: string | null;
  exchanges_hit: string[];
  mixer_hits: number;
  bridge_hits: number;
  total_value_eth: string | null;
  risk_score: number;
  risk_flags: string[];
}

const SYSTEM_PROMPT =
  "You are a blockchain forensics analyst. Output ONLY a 2-paragraph plain-English scam narrative. No preamble, no reasoning, no markdown. First paragraph: timeline and fund movement. Second paragraph: laundering pattern and destination. Be factual, concise, under 200 words total. If hops array is empty or inconclusive, output exactly: 'Insufficient hop data for narrative.'";

export async function generateNarrative(input: NarrativeInput): Promise<string | null> {
  const apiKey = process.env.AI_GATEWAY_API_KEY;
  if (!apiKey) return null;

  try {
    const { text } = await generateText({
      model: gateway("xiaomi/mimo-v2-flash"),
      temperature: 0.2,
      maxOutputTokens: 400,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: JSON.stringify({
            address: input.address,
            chain: input.chain,
            hop_count: input.hop_count,
            first_hop_time: input.first_hop_time,
            last_hop_time: input.last_hop_time,
            exchanges_hit: input.exchanges_hit,
            mixer_hits: input.mixer_hits,
            bridge_hits: input.bridge_hits,
            total_value_eth: input.total_value_eth,
            risk_score: input.risk_score,
            risk_flags: input.risk_flags,
          }),
        },
      ],
    });

    const trimmed = text?.trim();
    if (!trimmed) return null;
    return trimmed;
  } catch (err) {
    console.error("[AI Narrative] generation failed:", err);
    return null;
  }
}

export function buildNarrativeInput(report: {
  address: string;
  chain: string;
  hops: Array<{
    timestamp?: number;
    isMixer?: boolean;
    isBridge?: boolean;
    label?: string;
    value?: string;
  }>;
  risk_score?: number;
  risk_flags?: Array<{ label: string }>;
}): NarrativeInput {
  const hops = report.hops ?? [];
  const timestamps = hops.map((h) => h.timestamp).filter((t): t is number => typeof t === "number");

  const exchanges_hit = [
    ...new Set(hops.filter((h) => h.label).map((h) => h.label as string)),
  ];

  const mixer_hits = hops.filter((h) => h.isMixer).length;
  const bridge_hits = hops.filter((h) => h.isBridge).length;

  // Sum numeric ETH values where parseable
  let totalEth: number | null = null;
  for (const hop of hops) {
    const v = parseFloat(hop.value ?? "");
    if (!isNaN(v)) {
      totalEth = (totalEth ?? 0) + v;
    }
  }

  return {
    address: report.address,
    chain: report.chain,
    hop_count: hops.length,
    first_hop_time: timestamps.length > 0 ? new Date(Math.min(...timestamps) * 1000).toISOString() : null,
    last_hop_time: timestamps.length > 0 ? new Date(Math.max(...timestamps) * 1000).toISOString() : null,
    exchanges_hit,
    mixer_hits,
    bridge_hits,
    total_value_eth: totalEth !== null ? totalEth.toFixed(4) : null,
    risk_score: report.risk_score ?? 0,
    risk_flags: (report.risk_flags ?? []).map((f) => f.label),
  };
}
