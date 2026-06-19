import { complete } from "@/lib/ai/client";
import { ANALYST_PERSONA, jsonSchemaInstruction } from "@/lib/ai/prompts/system";
import type { CompanyProfile, FinancialPoint, PeerSnapshot } from "@/lib/data/types";

export interface ResearchAgentInput {
  profile: CompanyProfile;
  annual: FinancialPoint[];
  peers: PeerSnapshot[];
  currentPrice?: number;
  intrinsicValuePerShare?: number;
}

export interface ResearchReportOutput {
  oneLiner: string;
  businessOverview: string;
  industryOverview: string;
  growthDrivers: string[];
  competitiveAdvantages: string[];
  risks: { title: string; severity: "LOW" | "MEDIUM" | "HIGH"; description: string }[];
  managementQuality: string;
  capitalAllocation: string;
  scenarios: {
    bull: { thesis: string; targetPrice: number; probability: number };
    base: { thesis: string; targetPrice: number; probability: number };
    bear: { thesis: string; targetPrice: number; probability: number };
  };
  catalysts: { title: string; timeframe: string; description: string }[];
  expectedValuePerShare: number;
  recommendation: "BUY" | "ACCUMULATE" | "HOLD" | "REDUCE" | "AVOID";
  conviction: "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";
  investmentSummary: string;
  redFlags: string[];
}

const SCHEMA = `{
  "oneLiner": string,
  "businessOverview": string,
  "industryOverview": string,
  "growthDrivers": string[],
  "competitiveAdvantages": string[],
  "risks": [{"title": string, "severity": "LOW"|"MEDIUM"|"HIGH", "description": string}],
  "managementQuality": string,
  "capitalAllocation": string,
  "scenarios": {
    "bull": {"thesis": string, "targetPrice": number, "probability": number},
    "base": {"thesis": string, "targetPrice": number, "probability": number},
    "bear": {"thesis": string, "targetPrice": number, "probability": number}
  },
  "catalysts": [{"title": string, "timeframe": string, "description": string}],
  "expectedValuePerShare": number,
  "recommendation": "BUY"|"ACCUMULATE"|"HOLD"|"REDUCE"|"AVOID",
  "conviction": "LOW"|"MEDIUM"|"HIGH"|"VERY_HIGH",
  "investmentSummary": string,
  "redFlags": string[]
}`;

export async function runResearchAgent(input: ResearchAgentInput): Promise<ResearchReportOutput> {
  const compact = {
    profile: {
      ticker: input.profile.ticker,
      name: input.profile.name,
      sector: input.profile.sector,
      industry: input.profile.industry,
      marketCapCr: input.profile.marketCapCr,
      description: input.profile.description,
      businessModel: input.profile.businessModel,
      geographicMix: input.profile.geographicMix,
    },
    annual: input.annual.slice(0, 6).map((r) => ({
      fy: r.fiscalYear,
      revenueCr: r.revenueCr,
      ebitdaCr: r.ebitdaCr,
      patCr: r.patCr,
      fcfCr: r.fcfCr,
      roce: r.roce,
      roe: r.roe,
      debtToEquity: r.debtToEquity,
    })),
    peers: input.peers.slice(0, 6).map((p) => ({
      ticker: p.ticker,
      pe: p.pe,
      evEbitda: p.evEbitda,
      roce: p.roce,
      ebitdaMargin: p.ebitdaMargin,
    })),
    currentPrice: input.currentPrice,
    dcfIntrinsicValuePerShare: input.intrinsicValuePerShare,
  };

  const result = await complete({
    system: ANALYST_PERSONA + "\n\n" + jsonSchemaInstruction("InstitutionalResearchReport", SCHEMA),
    user: `Generate an institutional research report for ${input.profile.ticker} (${input.profile.name}).

Use the data below. Be specific. Bull / base / bear targets must be implied by named drivers, not just narrative. Probabilities must sum to ~1.0.

DATA:
${JSON.stringify(compact, null, 2)}`,
    asJson: true,
    maxTokens: 4096,
    temperature: 0.25,
  });

  if (!result.json) {
    return fallback(input);
  }
  return result.json as ResearchReportOutput;
}

function fallback(input: ResearchAgentInput): ResearchReportOutput {
  const lastFy = input.annual[0];
  const px = input.currentPrice ?? 0;
  return {
    oneLiner: `${input.profile.name} — placeholder report; configure an AI provider to enable live analysis.`,
    businessOverview: input.profile.description ?? "",
    industryOverview: `${input.profile.sector ?? ""} / ${input.profile.industry ?? ""}`,
    growthDrivers: ["Awaiting AI provider configuration"],
    competitiveAdvantages: [],
    risks: [{ title: "AI provider not configured", severity: "MEDIUM", description: "Add ANTHROPIC_API_KEY or OPENAI_API_KEY." }],
    managementQuality: "—",
    capitalAllocation: "—",
    scenarios: {
      bull: { thesis: "—", targetPrice: px * 1.4, probability: 0.25 },
      base: { thesis: "—", targetPrice: px * 1.1, probability: 0.5 },
      bear: { thesis: "—", targetPrice: px * 0.75, probability: 0.25 },
    },
    catalysts: [],
    expectedValuePerShare: px * 1.1,
    recommendation: "HOLD",
    conviction: "LOW",
    investmentSummary: `Last FY revenue ₹${lastFy?.revenueCr?.toFixed(0)} Cr; placeholder summary until AI provider is configured.`,
    redFlags: [],
  };
}
