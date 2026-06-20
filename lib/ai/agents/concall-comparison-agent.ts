import { complete } from "@/lib/ai/client";
import { ANALYST_PERSONA, jsonSchemaInstruction } from "@/lib/ai/prompts/system";
import type { ConcallSummary } from "@/lib/data/types";

export interface ConcallComparisonInput {
  focal: ConcallSummary;
  peers: ConcallSummary[];
}

export interface ConcallComparisonOutput {
  oneLine: string;
  // Themes everyone (focal + peers) is signalling — bullish for the sector
  convergentThemes: { theme: string; supportingTickers: string[]; impact: "BULLISH" | "NEUTRAL" | "BEARISH" }[];
  // Where the focal company is calling something different from the cohort
  divergentCalls: {
    topic: string;
    focalView: string;
    cohortView: string;
    interpretation: "POSITIVE_DIVERGENCE" | "NEGATIVE_DIVERGENCE" | "AMBIGUOUS";
  }[];
  // Cross-company comparison rows — one per dimension
  dimensions: {
    dimension: "Revenue guidance" | "EBITDA margin guidance" | "Capex" | "Order book / pipeline" | "Tone" | "Capital allocation" | "Key risk flagged";
    rows: { ticker: string; value: string }[];
    insight: string;
  }[];
  // What this means for the focal company's thesis
  implications: string[];
  // Cohort-level read across
  sectorRead: "ACCELERATING" | "STABLE" | "DECELERATING" | "MIXED";
}

const SCHEMA = `{
  "oneLine": string,
  "convergentThemes": [{"theme": string, "supportingTickers": string[], "impact": "BULLISH"|"NEUTRAL"|"BEARISH"}],
  "divergentCalls": [{"topic": string, "focalView": string, "cohortView": string, "interpretation": "POSITIVE_DIVERGENCE"|"NEGATIVE_DIVERGENCE"|"AMBIGUOUS"}],
  "dimensions": [
    {
      "dimension": "Revenue guidance"|"EBITDA margin guidance"|"Capex"|"Order book / pipeline"|"Tone"|"Capital allocation"|"Key risk flagged",
      "rows": [{"ticker": string, "value": string}],
      "insight": string
    }
  ],
  "implications": string[],
  "sectorRead": "ACCELERATING"|"STABLE"|"DECELERATING"|"MIXED"
}`;

// Deterministic comparison built from the structured ConcallSummary objects.
// Used both as the offline-mode output and as the data the AI agent enriches.
export function buildDeterministicComparison(input: ConcallComparisonInput): ConcallComparisonOutput {
  const all = [input.focal, ...input.peers];

  const rowsFor = (val: (s: ConcallSummary) => string) =>
    all.map((s) => ({ ticker: s.ticker, value: val(s) }));

  const dimensions: ConcallComparisonOutput["dimensions"] = [
    {
      dimension: "Revenue guidance",
      rows: rowsFor((s) => `${s.revenueGuidance.value} (${s.revenueGuidance.confidence}, ${s.revenueGuidance.horizon})`),
      insight: buildInsightRev(all),
    },
    {
      dimension: "EBITDA margin guidance",
      rows: rowsFor((s) => `${s.ebitdaMarginGuidance.value} (${s.ebitdaMarginGuidance.horizon})`),
      insight: buildInsightMargin(all),
    },
    {
      dimension: "Capex",
      rows: rowsFor((s) => s.capexGuidance.value),
      insight: "Capex intensity ranges suggest where the sector is investing for growth vs harvesting.",
    },
    {
      dimension: "Order book / pipeline",
      rows: rowsFor((s) =>
        s.orderBookCr ? `₹${s.orderBookCr.toLocaleString("en-IN")} Cr` : "Not reported",
      ),
      insight: "Order book coverage = visibility on FY25; absent for service / financial businesses.",
    },
    {
      dimension: "Tone",
      rows: rowsFor((s) => s.tone),
      insight: buildInsightTone(all),
    },
    {
      dimension: "Capital allocation",
      rows: rowsFor((s) => s.capitalAllocation[0] ?? "—"),
      insight: "Capital-allocation choices reveal whether managements expect re-investment opportunities or to return cash.",
    },
    {
      dimension: "Key risk flagged",
      rows: rowsFor((s) => s.risks[0] ?? "—"),
      insight: "Where every management cites the same risk, position-sizing should account for it.",
    },
  ];

  return {
    oneLine: `${input.focal.ticker}'s commentary read against ${input.peers.length} peers — ${tonalSummary(all)}.`,
    convergentThemes: buildConvergent(all),
    divergentCalls: buildDivergent(input.focal, input.peers),
    dimensions,
    implications: buildImplications(input.focal, input.peers),
    sectorRead: sectorRead(all),
  };
}

function buildInsightRev(all: ConcallSummary[]): string {
  const tones = all.map((s) => s.revenueGuidance.confidence);
  const highConfidence = tones.filter((t) => t === "HIGH").length;
  if (highConfidence >= all.length - 1) return "Cohort is uniformly confident on top-line — execution risk is the binding constraint.";
  if (highConfidence === 0) return "Nobody is calling the top-line with conviction — demand visibility is the swing factor.";
  return `${highConfidence} of ${all.length} are guiding with high confidence — divergence on demand visibility within the cohort.`;
}

function buildInsightMargin(all: ConcallSummary[]): string {
  return "Bands tighten where input-cost pass-through is established; widen for companies still investing through P&L.";
}

function buildInsightTone(all: ConcallSummary[]): string {
  const positives = all.filter((s) => s.tone === "POSITIVE").length;
  const negatives = all.filter((s) => s.tone === "NEGATIVE").length;
  if (positives === all.length) return "Unanimously constructive — watch for complacency / consensus crowding.";
  if (negatives === all.length) return "Cohort is cautious — opportunity if any one name surprises on guidance.";
  return `${positives} positive / ${negatives} negative — dispersion suggests bottom-up stock selection over sector beta.`;
}

function buildConvergent(all: ConcallSummary[]): ConcallComparisonOutput["convergentThemes"] {
  // Detect convergent drivers / risks by counting overlap of phrases.
  const driverCount = new Map<string, string[]>();
  all.forEach((s) =>
    s.growthDrivers.forEach((d) => {
      const key = d.toLowerCase();
      if (!driverCount.has(key)) driverCount.set(key, []);
      driverCount.get(key)!.push(s.ticker);
    }),
  );
  const convergent: ConcallComparisonOutput["convergentThemes"] = [];
  for (const [theme, tickers] of driverCount) {
    if (tickers.length >= Math.max(2, Math.ceil(all.length * 0.5))) {
      convergent.push({ theme, supportingTickers: tickers, impact: "BULLISH" });
    }
  }

  const riskCount = new Map<string, string[]>();
  all.forEach((s) =>
    s.risks.forEach((r) => {
      const key = r.toLowerCase();
      if (!riskCount.has(key)) riskCount.set(key, []);
      riskCount.get(key)!.push(s.ticker);
    }),
  );
  for (const [theme, tickers] of riskCount) {
    if (tickers.length >= Math.max(2, Math.ceil(all.length * 0.5))) {
      convergent.push({ theme, supportingTickers: tickers, impact: "BEARISH" });
    }
  }
  return convergent.slice(0, 8);
}

function buildDivergent(focal: ConcallSummary, peers: ConcallSummary[]): ConcallComparisonOutput["divergentCalls"] {
  const out: ConcallComparisonOutput["divergentCalls"] = [];

  // Tone divergence
  const peerTones = peers.map((p) => p.tone);
  const peerMajorityTone = mode(peerTones);
  if (peerMajorityTone && focal.tone !== peerMajorityTone) {
    out.push({
      topic: "Tone",
      focalView: focal.tone,
      cohortView: `${peerMajorityTone} (majority of peers)`,
      interpretation:
        focal.tone === "POSITIVE"
          ? "POSITIVE_DIVERGENCE"
          : focal.tone === "NEGATIVE"
          ? "NEGATIVE_DIVERGENCE"
          : "AMBIGUOUS",
    });
  }

  // Revenue confidence divergence
  const peerConfs = peers.map((p) => p.revenueGuidance.confidence);
  if (focal.revenueGuidance.confidence === "HIGH" && peerConfs.every((c) => c !== "HIGH")) {
    out.push({
      topic: "Revenue confidence",
      focalView: `Guiding with HIGH confidence on ${focal.revenueGuidance.value}`,
      cohortView: "No peer is guiding with HIGH confidence",
      interpretation: "POSITIVE_DIVERGENCE",
    });
  } else if (focal.revenueGuidance.confidence === "LOW" && peerConfs.every((c) => c !== "LOW")) {
    out.push({
      topic: "Revenue confidence",
      focalView: `Only LOW-confidence guidance on revenue`,
      cohortView: "Peers are guiding with at least MEDIUM confidence",
      interpretation: "NEGATIVE_DIVERGENCE",
    });
  }

  // Capex narrative divergence
  if (focal.capexGuidance.value.toLowerCase().includes("immaterial") && peers.some((p) => /heavy|greenfield|brownfield/.test(p.capexGuidance.value.toLowerCase()))) {
    out.push({
      topic: "Capex stance",
      focalView: "Asset-light / immaterial capex",
      cohortView: "Peers are in active capex cycle",
      interpretation: "AMBIGUOUS",
    });
  }

  return out;
}

function buildImplications(focal: ConcallSummary, peers: ConcallSummary[]): string[] {
  const out: string[] = [];
  const cohort = [focal, ...peers];
  const positives = cohort.filter((s) => s.tone === "POSITIVE").length;
  if (positives >= cohort.length - 1) {
    out.push(
      `Cohort-wide constructive tone — earnings revisions risk is to the upside; check that ${focal.ticker} valuations already discount this.`,
    );
  }
  if (focal.tone === "POSITIVE" && peers.every((p) => p.tone !== "POSITIVE")) {
    out.push(
      `${focal.ticker} is alone in striking a positive tone — verify with channel checks before assigning conviction premium.`,
    );
  }
  if (focal.orderBookCr && peers.every((p) => !p.orderBookCr || p.orderBookCr < focal.orderBookCr!)) {
    out.push(
      `${focal.ticker} carries the largest order-book among peers (~₹${focal.orderBookCr.toLocaleString("en-IN")} Cr) — execution becomes the key monitorable.`,
    );
  }
  if (out.length === 0) {
    out.push(`Cohort signals are mixed — focus thesis-monitoring on the indicators specific to ${focal.ticker}'s setup rather than sector beta.`);
  }
  return out;
}

function mode<T>(arr: T[]): T | undefined {
  if (arr.length === 0) return undefined;
  const counts = new Map<T, number>();
  arr.forEach((v) => counts.set(v, (counts.get(v) ?? 0) + 1));
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

function tonalSummary(all: ConcallSummary[]): string {
  const m = mode(all.map((s) => s.tone));
  if (m === "POSITIVE") return "cohort is broadly constructive";
  if (m === "NEGATIVE") return "cohort is cautious to negative";
  return "cohort is mixed";
}

function sectorRead(all: ConcallSummary[]): ConcallComparisonOutput["sectorRead"] {
  const pos = all.filter((s) => s.tone === "POSITIVE").length;
  const neg = all.filter((s) => s.tone === "NEGATIVE").length;
  if (pos >= all.length - 1) return "ACCELERATING";
  if (neg >= all.length - 1) return "DECELERATING";
  if (pos > neg) return "ACCELERATING";
  if (neg > pos) return "DECELERATING";
  return "MIXED";
}

export async function runConcallComparisonAgent(
  input: ConcallComparisonInput,
): Promise<ConcallComparisonOutput> {
  const deterministic = buildDeterministicComparison(input);

  // Compact payload — we don't need to send the full quotes / segments to the
  // agent, the dimensions + tones are enough for the synthesis layer.
  const compact = {
    focal: {
      ticker: input.focal.ticker,
      name: input.focal.companyName,
      tone: input.focal.tone,
      revenueGuidance: input.focal.revenueGuidance,
      ebitdaMarginGuidance: input.focal.ebitdaMarginGuidance,
      capexGuidance: input.focal.capexGuidance,
      orderBookCr: input.focal.orderBookCr,
      growthDrivers: input.focal.growthDrivers,
      risks: input.focal.risks,
      capitalAllocation: input.focal.capitalAllocation,
    },
    peers: input.peers.map((p) => ({
      ticker: p.ticker,
      name: p.companyName,
      tone: p.tone,
      revenueGuidance: p.revenueGuidance,
      ebitdaMarginGuidance: p.ebitdaMarginGuidance,
      capexGuidance: p.capexGuidance,
      orderBookCr: p.orderBookCr,
      growthDrivers: p.growthDrivers,
      risks: p.risks,
      capitalAllocation: p.capitalAllocation,
    })),
    deterministicView: deterministic,
  };

  const res = await complete({
    system:
      ANALYST_PERSONA +
      "\n\nYou are the Concall Comparison agent. You are given each company's structured guidance and a deterministic comparison matrix. Sharpen the convergent themes, surface real divergences, and write decision-grade implications that go beyond what is visible in the matrix. Cite tickers." +
      "\n\n" + jsonSchemaInstruction("ConcallComparison", SCHEMA),
    user: `Sharpen this comparison for ${input.focal.ticker}.

Match the dimensions shape exactly (one row per ticker). Do not invent numbers — use only the values in the data.

DATA:
${JSON.stringify(compact, null, 2)}`,
    asJson: true,
    maxTokens: 3500,
    temperature: 0.25,
  });

  if (res.json) {
    // The agent may return malformed dimensions — fall through to deterministic
    // for any field it skipped.
    const agentOut = res.json as Partial<ConcallComparisonOutput>;
    return {
      oneLine: agentOut.oneLine ?? deterministic.oneLine,
      convergentThemes: agentOut.convergentThemes ?? deterministic.convergentThemes,
      divergentCalls: agentOut.divergentCalls ?? deterministic.divergentCalls,
      dimensions: agentOut.dimensions?.length ? agentOut.dimensions : deterministic.dimensions,
      implications: agentOut.implications ?? deterministic.implications,
      sectorRead: agentOut.sectorRead ?? deterministic.sectorRead,
    };
  }
  return deterministic;
}
