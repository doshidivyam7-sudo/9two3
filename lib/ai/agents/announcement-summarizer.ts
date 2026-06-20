import { complete } from "@/lib/ai/client";
import { ANALYST_PERSONA, jsonSchemaInstruction } from "@/lib/ai/prompts/system";
import type { AnnouncementCategory } from "@/lib/data/types";

export interface AnnouncementSummariserInput {
  ticker?: string;
  companyName?: string;
  filingTitle?: string;
  // Raw announcement text — typically from a PDF parse or NSE/BSE feed body.
  text: string;
}

export interface AnnouncementSummary {
  category: AnnouncementCategory;
  headline: string;
  // Exactly 3 sentences max — what an analyst writes in their morning brief.
  summary: string;
  impact: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  isMaterial: boolean;
  // Why it matters for an investor (1 line).
  thesisImpact: string;
}

const CATEGORIES: AnnouncementCategory[] = [
  "RESULTS",
  "DIVIDEND",
  "BOARD_MEETING",
  "CAPITAL_RAISE",
  "ALLOTMENT",
  "MA",
  "CREDIT_RATING",
  "INSIDER_TRADE",
  "CAPEX",
  "ORDER_WIN",
  "REGULATORY",
  "MANAGEMENT_CHANGE",
  "OTHER",
];

const SCHEMA = `{
  "category": one of ${JSON.stringify(CATEGORIES)},
  "headline": string,
  "summary": string,
  "impact": "POSITIVE"|"NEGATIVE"|"NEUTRAL",
  "isMaterial": boolean,
  "thesisImpact": string
}`;

const MAX_INPUT_CHARS = 40_000;

export async function runAnnouncementSummariser(
  input: AnnouncementSummariserInput,
): Promise<AnnouncementSummary> {
  const text = input.text.length > MAX_INPUT_CHARS
    ? input.text.slice(0, MAX_INPUT_CHARS) + "\n\n[truncated]"
    : input.text;

  const res = await complete({
    system:
      ANALYST_PERSONA +
      "\n\nYou are the Corporate Announcement Summariser. Your job: read an exchange filing and produce a 3-sentence summary an institutional analyst can scan in five seconds. Be precise about numbers; do not invent figures not in the text. If the announcement is non-material housekeeping, mark isMaterial = false so it can be deprioritised in the feed." +
      "\n\n" + jsonSchemaInstruction("AnnouncementSummary", SCHEMA),
    user: `Summarise this corporate announcement.

${input.ticker ? `Ticker: ${input.ticker}` : ""}
${input.companyName ? `Company: ${input.companyName}` : ""}
${input.filingTitle ? `Filing title: ${input.filingTitle}` : ""}

Constraints on the "summary" field:
- Exactly 1–3 sentences (no more).
- Lead with the most decision-relevant fact.
- Quote exact numbers (₹ Cr, %, share counts, dates) from the filing.
- No sales language, no exclamation marks, no emojis.

ANNOUNCEMENT TEXT:
---
${text}
---`,
    asJson: true,
    maxTokens: 1200,
    temperature: 0.15,
  });

  if (res.json) return res.json as AnnouncementSummary;

  // Offline fallback — heuristic 3-liner from the first ~300 chars.
  const compact = input.text.replace(/\s+/g, " ").trim().slice(0, 280);
  return {
    category: "OTHER",
    headline: input.filingTitle ?? "Exchange Filing",
    summary: compact + (input.text.length > 280 ? "…" : ""),
    impact: "NEUTRAL",
    isMaterial: false,
    thesisImpact: "AI provider not configured — could not assess thesis impact.",
  };
}
