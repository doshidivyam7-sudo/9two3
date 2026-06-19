import { complete } from "@/lib/ai/client";
import { ANALYST_PERSONA, jsonSchemaInstruction } from "@/lib/ai/prompts/system";
import type { CompanyProfile, FinancialPoint, NewsHeadline } from "@/lib/data/types";

export interface RiskAgentInput {
  profile: CompanyProfile;
  annual: FinancialPoint[];
  recentNews: NewsHeadline[];
}

export interface RiskAssessment {
  overallRiskLevel: "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";
  governanceRisks: { risk: string; evidence: string; severity: "LOW" | "MEDIUM" | "HIGH" }[];
  businessRisks: { risk: string; evidence: string; severity: "LOW" | "MEDIUM" | "HIGH" }[];
  financialRisks: { risk: string; evidence: string; severity: "LOW" | "MEDIUM" | "HIGH" }[];
  regulatoryRisks: { risk: string; evidence: string; severity: "LOW" | "MEDIUM" | "HIGH" }[];
  macroRisks: { risk: string; evidence: string; severity: "LOW" | "MEDIUM" | "HIGH" }[];
  forensicScreens: { check: string; status: "OK" | "WATCH" | "FAIL"; note: string }[];
  hiddenRisks: string[];
  permanentLossProbability: number;
}

const SCHEMA = `{
  "overallRiskLevel": "LOW"|"MEDIUM"|"HIGH"|"VERY_HIGH",
  "governanceRisks": [{"risk": string, "evidence": string, "severity": "LOW"|"MEDIUM"|"HIGH"}],
  "businessRisks": [{"risk": string, "evidence": string, "severity": "LOW"|"MEDIUM"|"HIGH"}],
  "financialRisks": [{"risk": string, "evidence": string, "severity": "LOW"|"MEDIUM"|"HIGH"}],
  "regulatoryRisks": [{"risk": string, "evidence": string, "severity": "LOW"|"MEDIUM"|"HIGH"}],
  "macroRisks": [{"risk": string, "evidence": string, "severity": "LOW"|"MEDIUM"|"HIGH"}],
  "forensicScreens": [{"check": string, "status": "OK"|"WATCH"|"FAIL", "note": string}],
  "hiddenRisks": string[],
  "permanentLossProbability": number
}`;

export async function runRiskAgent(input: RiskAgentInput): Promise<RiskAssessment> {
  const res = await complete({
    system: ANALYST_PERSONA + "\n\nYou are biased toward downside. Hunt for the things that can cause permanent loss of capital. Cite specific evidence in the data given, not generic risks.\n\n" + jsonSchemaInstruction("RiskAssessment", SCHEMA),
    user: `Run a downside-biased risk review for ${input.profile.ticker} (${input.profile.name}).

PROFILE: ${JSON.stringify(input.profile)}
LAST 5Y FINANCIALS: ${JSON.stringify(input.annual.slice(0, 5))}
RECENT NEWS: ${JSON.stringify(input.recentNews.slice(0, 10))}

Apply standard forensic screens (CFO/PAT gap, related-party exposure, receivable buildup, contingent liabilities, pledge of promoter holdings, auditor changes, frequent equity raises, off-balance-sheet vehicles). Mark each screen OK / WATCH / FAIL with a short note. Estimate the probability of permanent capital loss over a 5y horizon as a number in [0,1].`,
    asJson: true,
    maxTokens: 3000,
  });
  if (res.json) return res.json as RiskAssessment;
  return {
    overallRiskLevel: "MEDIUM",
    governanceRisks: [],
    businessRisks: [],
    financialRisks: [],
    regulatoryRisks: [],
    macroRisks: [],
    forensicScreens: [],
    hiddenRisks: ["AI provider not configured."],
    permanentLossProbability: 0.1,
  };
}
