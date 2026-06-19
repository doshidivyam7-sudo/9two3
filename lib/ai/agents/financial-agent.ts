import { complete } from "@/lib/ai/client";
import { ANALYST_PERSONA, jsonSchemaInstruction } from "@/lib/ai/prompts/system";
import type { FinancialPoint } from "@/lib/data/types";
import { cagr } from "@/lib/format";

export interface FinancialAgentInput {
  ticker: string;
  companyName: string;
  annual: FinancialPoint[];
}

export interface FinancialAnalysis {
  growthQuality: "WEAK" | "MEDIOCRE" | "GOOD" | "EXCEPTIONAL";
  returnProfile: "LOW" | "MEDIUM" | "HIGH" | "BEST_IN_CLASS";
  capitalEfficiency: string;
  earningsQuality: string;
  cashConversion: string;
  balanceSheetStrength: "WEAK" | "STABLE" | "STRONG" | "FORTRESS";
  workingCapital: string;
  redLines: string[];
  oneLine: string;
  observations: string[];
  metrics: {
    revenueCagr10y?: number;
    ebitdaCagr10y?: number;
    patCagr10y?: number;
    avgRoce?: number;
    avgRoe?: number;
    fcfConversion?: number;
  };
}

const SCHEMA = `{
  "growthQuality": "WEAK"|"MEDIOCRE"|"GOOD"|"EXCEPTIONAL",
  "returnProfile": "LOW"|"MEDIUM"|"HIGH"|"BEST_IN_CLASS",
  "capitalEfficiency": string,
  "earningsQuality": string,
  "cashConversion": string,
  "balanceSheetStrength": "WEAK"|"STABLE"|"STRONG"|"FORTRESS",
  "workingCapital": string,
  "redLines": string[],
  "oneLine": string,
  "observations": string[],
  "metrics": {
    "revenueCagr10y": number,
    "ebitdaCagr10y": number,
    "patCagr10y": number,
    "avgRoce": number,
    "avgRoe": number,
    "fcfConversion": number
  }
}`;

function computeMetrics(annual: FinancialPoint[]) {
  if (annual.length < 2) return {};
  const sorted = [...annual].sort((a, b) => a.fiscalYear - b.fiscalYear);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const years = last.fiscalYear - first.fiscalYear;
  const safe = (a?: number, b?: number) =>
    a && b && years > 0 ? cagr(a, b, years) ?? undefined : undefined;
  const avg = (key: keyof FinancialPoint) => {
    const vals = sorted.map((r) => r[key] as number).filter((n) => typeof n === "number");
    if (!vals.length) return undefined;
    return vals.reduce((s, n) => s + n, 0) / vals.length;
  };
  const fcfConv = (() => {
    const num = sorted.reduce((s, r) => s + (r.fcfCr ?? 0), 0);
    const den = sorted.reduce((s, r) => s + (r.patCr ?? 0), 0);
    return den ? num / den : undefined;
  })();
  return {
    revenueCagr10y: safe(first.revenueCr, last.revenueCr),
    ebitdaCagr10y: safe(first.ebitdaCr, last.ebitdaCr),
    patCagr10y: safe(first.patCr, last.patCr),
    avgRoce: avg("roce"),
    avgRoe: avg("roe"),
    fcfConversion: fcfConv,
  };
}

export async function runFinancialAgent(input: FinancialAgentInput): Promise<FinancialAnalysis> {
  const metrics = computeMetrics(input.annual);
  const compact = input.annual.slice(0, 8).map((r) => ({
    fy: r.fiscalYear,
    revenue: r.revenueCr,
    ebitda: r.ebitdaCr,
    pat: r.patCr,
    cfo: r.cfoCr,
    fcf: r.fcfCr,
    roce: r.roce,
    roe: r.roe,
    debtToEquity: r.debtToEquity,
    wcDays: r.receivableDays,
  }));

  const res = await complete({
    system: ANALYST_PERSONA + "\n\n" + jsonSchemaInstruction("FinancialAnalysis", SCHEMA),
    user: `Analyze the financial profile of ${input.ticker} (${input.companyName}).

Computed metrics: ${JSON.stringify(metrics)}
Last 8 years (compact): ${JSON.stringify(compact)}

Comment on quality of growth, durability of returns, working-capital trends, and any earnings-quality concerns (gap between PAT and FCF, capex intensity, related-party items if visible).`,
    asJson: true,
    maxTokens: 2400,
  });

  if (res.json) {
    return { ...(res.json as FinancialAnalysis), metrics };
  }
  return {
    growthQuality: "MEDIOCRE",
    returnProfile: "MEDIUM",
    capitalEfficiency: "AI provider not configured.",
    earningsQuality: "—",
    cashConversion: "—",
    balanceSheetStrength: "STABLE",
    workingCapital: "—",
    redLines: [],
    oneLine: "Configure ANTHROPIC_API_KEY or OPENAI_API_KEY to enable AI commentary.",
    observations: [],
    metrics,
  };
}
