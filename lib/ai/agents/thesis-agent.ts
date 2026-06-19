import { complete } from "@/lib/ai/client";
import { ANALYST_PERSONA, jsonSchemaInstruction } from "@/lib/ai/prompts/system";
import type { FinancialPoint, NewsHeadline } from "@/lib/data/types";

export interface ThesisMonitorInput {
  ticker: string;
  companyName: string;
  thesis: string;
  leadIndicators: { indicator: string; target: string; direction: "UP" | "DOWN" | "STABLE" }[];
  bullCase?: string;
  baseCase?: string;
  bearCase?: string;
  recentAnnual: FinancialPoint[];
  recentNews: NewsHeadline[];
  documentSnippets: { title: string; snippet: string }[];
}

export type ThesisVerdict = "STRENGTHENED" | "INTACT" | "WEAKENED" | "BROKEN";

export interface ThesisMonitorOutput {
  verdict: ThesisVerdict;
  score: number; // -1 (broken) to +1 (strengthened)
  oneLine: string;
  reasoning: string;
  indicatorChecks: {
    indicator: string;
    status: "MET" | "ON_TRACK" | "MISSED" | "UNKNOWN";
    evidence: string;
  }[];
  newEvidence: { type: "RESULT" | "NEWS" | "CONCALL" | "FILING"; summary: string; impact: "BULLISH" | "NEUTRAL" | "BEARISH" }[];
  recommendedAction: "HOLD" | "ADD" | "TRIM" | "EXIT" | "REVIEW";
  invalidationTriggers: string[];
}

const SCHEMA = `{
  "verdict": "STRENGTHENED"|"INTACT"|"WEAKENED"|"BROKEN",
  "score": number,
  "oneLine": string,
  "reasoning": string,
  "indicatorChecks": [{"indicator": string, "status": "MET"|"ON_TRACK"|"MISSED"|"UNKNOWN", "evidence": string}],
  "newEvidence": [{"type": "RESULT"|"NEWS"|"CONCALL"|"FILING", "summary": string, "impact": "BULLISH"|"NEUTRAL"|"BEARISH"}],
  "recommendedAction": "HOLD"|"ADD"|"TRIM"|"EXIT"|"REVIEW",
  "invalidationTriggers": string[]
}`;

export async function runThesisAgent(input: ThesisMonitorInput): Promise<ThesisMonitorOutput> {
  const res = await complete({
    system: ANALYST_PERSONA +
      "\n\nYou are the Thesis Monitor agent. Your job is to grade whether new evidence strengthens, leaves intact, weakens, or breaks an existing investment thesis. Be falsifiable and cite the specific evidence." +
      "\n\n" + jsonSchemaInstruction("ThesisCheck", SCHEMA),
    user: `Evaluate this investment thesis for ${input.ticker} (${input.companyName}).

THESIS: ${input.thesis}
LEAD INDICATORS: ${JSON.stringify(input.leadIndicators)}
BULL: ${input.bullCase ?? "—"}
BASE: ${input.baseCase ?? "—"}
BEAR: ${input.bearCase ?? "—"}

NEW EVIDENCE
- Latest annuals: ${JSON.stringify(input.recentAnnual.slice(0, 3).map((r) => ({
      fy: r.fiscalYear,
      revenue: r.revenueCr,
      ebitda: r.ebitdaCr,
      pat: r.patCr,
      fcf: r.fcfCr,
      roce: r.roce,
    })))}
- Recent news (last 90d): ${JSON.stringify(input.recentNews.slice(0, 10))}
- Document snippets: ${JSON.stringify(input.documentSnippets.slice(0, 6))}

For each lead indicator, mark MET / ON_TRACK / MISSED / UNKNOWN. Final verdict should follow logically from the indicator checks. Score is in [-1, +1].`,
    asJson: true,
    maxTokens: 3200,
  });

  if (res.json) return res.json as ThesisMonitorOutput;
  return {
    verdict: "INTACT",
    score: 0,
    oneLine: "AI provider not configured.",
    reasoning: "Add ANTHROPIC_API_KEY or OPENAI_API_KEY to enable Thesis Monitor.",
    indicatorChecks: input.leadIndicators.map((i) => ({
      indicator: i.indicator,
      status: "UNKNOWN",
      evidence: "—",
    })),
    newEvidence: [],
    recommendedAction: "HOLD",
    invalidationTriggers: [],
  };
}
