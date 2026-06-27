import { complete } from "@/lib/ai/client";
import { ANALYST_PERSONA } from "@/lib/ai/prompts/system";
import type {
  CompanyProfile,
  ConcallSummary,
  CorporateAnnouncement,
  FinancialPoint,
  NewsHeadline,
  PeerSnapshot,
  SegmentMix,
} from "@/lib/data/types";

export interface CompanyChatContext {
  profile: CompanyProfile;
  annual: FinancialPoint[];
  segments: SegmentMix[];
  peers: PeerSnapshot[];
  concall: ConcallSummary | null;
  announcements: CorporateAnnouncement[];
  news: NewsHeadline[];
  currentPrice?: number;
}

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface CompanyChatResult {
  answer: string;
  // Which context buckets the answer drew on — surfaced as citation chips.
  sources: string[];
}

// Build a compact, token-bounded context block from the full company data.
function buildContextBlock(ctx: CompanyChatContext): string {
  const lastFY = ctx.annual[0];
  const annualCompact = ctx.annual.slice(0, 10).map((r) => ({
    fy: r.fiscalYear,
    revenueCr: r.revenueCr,
    ebitdaCr: r.ebitdaCr,
    patCr: r.patCr,
    fcfCr: r.fcfCr,
    roce: r.roce,
    roe: r.roe,
    debtToEquity: r.debtToEquity,
    ebitdaMargin: r.ebitdaMargin,
    patMargin: r.patMargin,
    pe: r.pe,
    evEbitda: r.evEbitda,
  }));

  return JSON.stringify({
    profile: {
      ticker: ctx.profile.ticker,
      name: ctx.profile.name,
      sector: ctx.profile.sector,
      industry: ctx.profile.industry,
      description: ctx.profile.description,
      businessModel: ctx.profile.businessModel,
      marketCapCr: ctx.profile.marketCapCr,
      geographicMix: ctx.profile.geographicMix,
    },
    currentPrice: ctx.currentPrice,
    latestFY: lastFY?.fiscalYear,
    annual: annualCompact,
    segments: ctx.segments[0],
    peers: ctx.peers.slice(0, 6).map((p) => ({
      ticker: p.ticker, pe: p.pe, evEbitda: p.evEbitda, roce: p.roce, ebitdaMargin: p.ebitdaMargin,
    })),
    concall: ctx.concall ? {
      period: ctx.concall.period,
      revenueGuidance: ctx.concall.revenueGuidance,
      ebitdaMarginGuidance: ctx.concall.ebitdaMarginGuidance,
      capexGuidance: ctx.concall.capexGuidance,
      orderBookCr: ctx.concall.orderBookCr,
      growthDrivers: ctx.concall.growthDrivers,
      risks: ctx.concall.risks,
      tone: ctx.concall.tone,
    } : null,
    announcements: ctx.announcements.slice(0, 6).map((a) => ({
      category: a.category, headline: a.headline, summary: a.summary, impact: a.impact, date: a.announcedAt,
    })),
    news: ctx.news.slice(0, 6).map((n) => ({ headline: n.headline, date: n.publishedAt })),
  });
}

const SOURCE_BUCKETS = ["Financials", "Valuation", "Concall", "Peers", "Announcements", "News", "Profile"];

export async function runCompanyChat(
  ctx: CompanyChatContext,
  history: ChatTurn[],
  question: string,
): Promise<CompanyChatResult> {
  const contextBlock = buildContextBlock(ctx);
  const historyText = history
    .slice(-8)
    .map((t) => `${t.role === "user" ? "Analyst" : "Copilot"}: ${t.content}`)
    .join("\n");

  const res = await complete({
    system:
      ANALYST_PERSONA +
      `\n\nYou are the Company Copilot — a research assistant answering questions about ${ctx.profile.ticker} (${ctx.profile.name}). ` +
      "Answer ONLY from the structured CONTEXT provided. If the answer isn't in the context, say so plainly and suggest what data would be needed. " +
      "Be concise and quantitative; cite specific figures (₹ Cr, %, x, FY). Use INR Cr and Indian fiscal-year conventions. " +
      "End your answer with a line starting exactly with 'SOURCES:' followed by a comma-separated subset of " +
      `[${SOURCE_BUCKETS.join(", ")}] indicating which context buckets you used.`,
    user: `CONTEXT:\n${contextBlock}\n\n${historyText ? `CONVERSATION SO FAR:\n${historyText}\n\n` : ""}ANALYST QUESTION: ${question}`,
    maxTokens: 1200,
    temperature: 0.2,
  });

  // Split out the SOURCES: trailer.
  const text = res.text ?? "";
  const srcMatch = text.match(/SOURCES:\s*(.+)\s*$/i);
  let sources: string[] = [];
  let answer = text;
  if (srcMatch) {
    sources = srcMatch[1]
      .split(",")
      .map((s) => s.trim())
      .filter((s) => SOURCE_BUCKETS.includes(s));
    answer = text.slice(0, srcMatch.index).trim();
  }

  if (!answer || answer.startsWith("[AI offline]")) {
    return {
      answer:
        "AI provider not configured. Add ANTHROPIC_API_KEY or OPENAI_API_KEY to enable the Company Copilot. " +
        `Meanwhile: ${ctx.profile.name} latest FY revenue was ₹${ctx.annual[0]?.revenueCr?.toFixed(0)} Cr, ROCE ${((ctx.annual[0]?.roce ?? 0) * 100).toFixed(1)}%.`,
      sources: [],
    };
  }

  return { answer, sources };
}
