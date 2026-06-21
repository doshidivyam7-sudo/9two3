import { complete } from "@/lib/ai/client";
import { ANALYST_PERSONA, jsonSchemaInstruction } from "@/lib/ai/prompts/system";
import type { ScreenerFilter, ScreenerSortKey } from "@/lib/data/screener";

export interface ScreenerTranslateInput {
  prompt: string;
  // For UI suggestions — known sectors in the universe so the LLM can map.
  knownSectors?: string[];
}

export interface ScreenerTranslateOutput {
  rationale: string;
  filter: ScreenerFilter;
  sort?: { key: ScreenerSortKey; dir: "asc" | "desc" };
}

const SCHEMA = `{
  "rationale": string (1-2 sentences explaining how you interpreted the prompt),
  "filter": {
    "sectors": string[]?,
    "industries": string[]?,
    "marketCapMinCr": number?,
    "marketCapMaxCr": number?,
    "roceMinPct": number?,
    "roeMinPct": number?,
    "revenueCagrMinPct": number?,
    "patCagrMinPct": number?,
    "ebitdaMarginMinPct": number?,
    "divYieldMinPct": number?,
    "debtEquityMax": number?,
    "peMin": number?,
    "peMax": number?,
    "evEbitdaMax": number?,
    "evSalesMax": number?,
    "pbMax": number?
  },
  "sort": { "key": "marketCapCr"|"revenueCr"|"patCr"|"revenueCagr9y"|"patCagr9y"|"ebitdaMargin"|"patMargin"|"roce"|"roe"|"debtToEquity"|"pe"|"evEbitda"|"evSales"|"pb"|"divYield", "dir": "asc"|"desc" }?
}`;

export async function runScreenerTranslator(input: ScreenerTranslateInput): Promise<ScreenerTranslateOutput> {
  const res = await complete({
    system: ANALYST_PERSONA +
      "\n\nYou translate plain-English screening ideas from a buy-side analyst into a structured filter spec for the company screener. Be conservative — only set fields the prompt clearly implies. Indian context: market cap is in INR Crore (₹1 lakh Cr = ₹1 trillion). PEs in India are typically 15-50x; ROCE 10-40%; revenue CAGR for compounders is 12-25%." +
      "\n\n" + jsonSchemaInstruction("ScreenerTranslate", SCHEMA),
    user: `Known sectors in the universe: ${(input.knownSectors ?? []).join(", ") || "Energy, Information Technology, Financials, Industrials"}.

Prompt: """${input.prompt}"""`,
    asJson: true,
    maxTokens: 800,
    temperature: 0.15,
  });
  if (res.json) return res.json as ScreenerTranslateOutput;
  // Offline fallback — keyword heuristics.
  return heuristicTranslate(input.prompt);
}

function heuristicTranslate(prompt: string): ScreenerTranslateOutput {
  const p = prompt.toLowerCase();
  const filter: ScreenerFilter = {};
  let sort: ScreenerTranslateOutput["sort"];
  if (/quality|compounder|moat/.test(p)) {
    filter.roceMinPct = 20;
    filter.debtEquityMax = 0.5;
    sort = { key: "roce", dir: "desc" };
  }
  if (/growth|fast/.test(p)) {
    filter.revenueCagrMinPct = 15;
    sort = { key: "revenueCagr9y", dir: "desc" };
  }
  if (/cheap|value|undervalued/.test(p)) {
    filter.peMax = 20;
    filter.evEbitdaMax = 12;
    sort = { key: "pe", dir: "asc" };
  }
  if (/dividend|yield/.test(p)) {
    filter.divYieldMinPct = 1.5;
    sort = { key: "divYield", dir: "desc" };
  }
  if (/no debt|debt[\s-]?free|low leverage/.test(p)) {
    filter.debtEquityMax = 0.2;
  }
  if (/large[\s-]?cap/.test(p)) filter.marketCapMinCr = 5_00_000;
  if (/mid[\s-]?cap/.test(p)) { filter.marketCapMinCr = 10_000; filter.marketCapMaxCr = 1_50_000; }
  if (/small[\s-]?cap/.test(p)) filter.marketCapMaxCr = 10_000;
  if (/it|technology|software/.test(p)) filter.sectors = ["Information Technology"];
  if (/financial|bank|nbfc/.test(p)) filter.sectors = ["Financials"];
  if (/industrial|capex|capital goods/.test(p)) filter.sectors = ["Industrials"];
  if (/energy|oil|gas/.test(p)) filter.sectors = ["Energy"];
  return {
    rationale: "AI provider not configured — applied keyword-based heuristics. Add ANTHROPIC_API_KEY or OPENAI_API_KEY for full NL translation.",
    filter,
    sort,
  };
}
