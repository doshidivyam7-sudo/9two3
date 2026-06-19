import { complete } from "@/lib/ai/client";
import { ANALYST_PERSONA, jsonSchemaInstruction } from "@/lib/ai/prompts/system";

export interface EarningsAgentInput {
  companyName: string;
  ticker: string;
  documentTitle: string;
  documentKind: string;
  text: string;
}

export interface EarningsExtraction {
  summary: string;
  managementCommentary: string[];
  growthDrivers: string[];
  guidance: { metric: string; value: string; horizon: string; confidence: "LOW" | "MEDIUM" | "HIGH" }[];
  capitalAllocation: string[];
  futureCapex: string[];
  marginCommentary: string[];
  risks: string[];
  redFlags: { flag: string; severity: "LOW" | "MEDIUM" | "HIGH"; quote?: string }[];
  notableQuotes: { speaker: string; quote: string; topic: string }[];
  segmentMentions: { segment: string; commentary: string }[];
  qNa: { question: string; answerSummary: string }[];
  overallTone: "POSITIVE" | "CAUTIOUS" | "NEGATIVE";
}

const SCHEMA = `{
  "summary": string,
  "managementCommentary": string[],
  "growthDrivers": string[],
  "guidance": [{"metric": string, "value": string, "horizon": string, "confidence": "LOW"|"MEDIUM"|"HIGH"}],
  "capitalAllocation": string[],
  "futureCapex": string[],
  "marginCommentary": string[],
  "risks": string[],
  "redFlags": [{"flag": string, "severity": "LOW"|"MEDIUM"|"HIGH", "quote": string}],
  "notableQuotes": [{"speaker": string, "quote": string, "topic": string}],
  "segmentMentions": [{"segment": string, "commentary": string}],
  "qNa": [{"question": string, "answerSummary": string}],
  "overallTone": "POSITIVE"|"CAUTIOUS"|"NEGATIVE"
}`;

const MAX_INPUT_CHARS = 60_000;

export async function runEarningsAgent(input: EarningsAgentInput): Promise<EarningsExtraction> {
  const truncated = input.text.length > MAX_INPUT_CHARS
    ? input.text.slice(0, MAX_INPUT_CHARS) + "\n\n[truncated]"
    : input.text;

  const res = await complete({
    system: ANALYST_PERSONA + "\n\n" + jsonSchemaInstruction("EarningsExtraction", SCHEMA),
    user: `Extract decision-relevant content from this ${input.documentKind} for ${input.ticker} (${input.companyName}).

Title: ${input.documentTitle}

Focus on: forward-looking guidance, growth drivers, margins, capital allocation, capex plans, and any management hedging or red flags. Quote sparingly but verbatim where the words matter.

DOCUMENT:
---
${truncated}
---`,
    asJson: true,
    maxTokens: 4096,
    temperature: 0.2,
  });

  if (res.json) return res.json as EarningsExtraction;
  return {
    summary: "AI provider not configured.",
    managementCommentary: [],
    growthDrivers: [],
    guidance: [],
    capitalAllocation: [],
    futureCapex: [],
    marginCommentary: [],
    risks: [],
    redFlags: [],
    notableQuotes: [],
    segmentMentions: [],
    qNa: [],
    overallTone: "CAUTIOUS",
  };
}
