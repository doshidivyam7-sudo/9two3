import { complete } from "@/lib/ai/client";
import { ANALYST_PERSONA, jsonSchemaInstruction } from "@/lib/ai/prompts/system";
import type { CompanyProfile, FinancialPoint } from "@/lib/data/types";
import { defaultAssumptionsFromFundamentals, type DCFAssumptions } from "@/lib/valuation/dcf";

export interface ValuationAgentInput {
  profile: CompanyProfile;
  annual: FinancialPoint[];
}

export interface SuggestedAssumptions {
  rationale: string;
  assumptions: DCFAssumptions;
  riskAdjustedFairValuePerShare?: number;
  confidence: "LOW" | "MEDIUM" | "HIGH";
}

const SCHEMA = `{
  "rationale": string,
  "assumptions": {
    "baseRevenueCr": number,
    "revenueGrowth": number[],
    "ebitdaMargin": number,
    "daPctOfRevenue": number,
    "taxRate": number,
    "capexPctOfRevenue": number,
    "workingCapitalPctOfIncRev": number,
    "wacc": number,
    "terminalGrowth": number,
    "netDebtCr": number,
    "sharesOutstandingCr": number
  },
  "riskAdjustedFairValuePerShare": number,
  "confidence": "LOW"|"MEDIUM"|"HIGH"
}`;

export async function runValuationAgent(input: ValuationAgentInput): Promise<SuggestedAssumptions> {
  const last = input.annual[0];
  const seed = defaultAssumptionsFromFundamentals({
    baseRevenueCr: last?.revenueCr ?? 1000,
    ebitdaMargin: last?.ebitdaMargin ?? 0.18,
    netDebtCr: last?.netDebtCr ?? 0,
    sharesOutstandingCr: last?.sharesOutstandingCr ?? 10,
  });

  const res = await complete({
    system: ANALYST_PERSONA + "\n\n" + jsonSchemaInstruction("SuggestedAssumptions", SCHEMA),
    user: `Suggest DCF assumptions for ${input.profile.ticker} (${input.profile.name}).

Seed assumptions (you may revise): ${JSON.stringify(seed)}

Last 6 FY financials: ${JSON.stringify(input.annual.slice(0, 6).map((r) => ({
      fy: r.fiscalYear,
      revenue: r.revenueCr,
      ebitda: r.ebitdaCr,
      pat: r.patCr,
      fcf: r.fcfCr,
      roce: r.roce,
      ebitdaMargin: r.ebitdaMargin,
    })))}

Rules:
- 10-year horizon (revenueGrowth array length = 10).
- Growth should fade to a sustainable rate (≤ 7%) by year 7.
- Terminal growth ≤ 5%.
- WACC must exceed terminal growth.
- Reflect Indian corporate tax (~25.17%) unless company is in SEZ / concessional regime.
- Use INR Cr units; do not change netDebtCr / sharesOutstandingCr unless data warrants.`,
    asJson: true,
    maxTokens: 2400,
  });

  if (res.json) {
    const j = res.json as SuggestedAssumptions;
    return j;
  }
  return {
    rationale: "AI provider not configured — returning seed assumptions.",
    assumptions: seed,
    confidence: "LOW",
  };
}
