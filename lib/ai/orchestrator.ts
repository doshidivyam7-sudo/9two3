// Coordinates multiple agents into a full research report.

import { marketData } from "@/lib/data";
import { runFinancialAgent } from "@/lib/ai/agents/financial-agent";
import { runResearchAgent } from "@/lib/ai/agents/research-agent";
import { runRiskAgent } from "@/lib/ai/agents/risk-agent";
import { runValuationAgent } from "@/lib/ai/agents/valuation-agent";
import { runDCF } from "@/lib/valuation/dcf";

export interface FullReportResult {
  profile: Awaited<ReturnType<ReturnType<typeof marketData>["getProfile"]>>;
  quote: Awaited<ReturnType<ReturnType<typeof marketData>["getQuote"]>>;
  annual: Awaited<ReturnType<ReturnType<typeof marketData>["getAnnualFinancials"]>>;
  segments: Awaited<ReturnType<ReturnType<typeof marketData>["getRevenueSegments"]>>;
  peers: Awaited<ReturnType<ReturnType<typeof marketData>["getPeers"]>>;
  news: Awaited<ReturnType<ReturnType<typeof marketData>["getNews"]>>;
  financialAnalysis: Awaited<ReturnType<typeof runFinancialAgent>>;
  risk: Awaited<ReturnType<typeof runRiskAgent>>;
  valuationAssumptions: Awaited<ReturnType<typeof runValuationAgent>>;
  dcf: ReturnType<typeof runDCF>;
  report: Awaited<ReturnType<typeof runResearchAgent>>;
}

export async function buildFullReport(ticker: string): Promise<FullReportResult> {
  const md = marketData();
  const [profile, quote, annual, segments, peers, news] = await Promise.all([
    md.getProfile(ticker),
    md.getQuote(ticker),
    md.getAnnualFinancials(ticker, 10),
    md.getRevenueSegments(ticker),
    md.getPeers(ticker),
    md.getNews(ticker, 12),
  ]);
  if (!profile) throw new Error(`Ticker ${ticker} not found`);

  // Stage 1: parallel analyst agents that only need company data
  const [financialAnalysis, risk, valuationAssumptions] = await Promise.all([
    runFinancialAgent({ ticker, companyName: profile.name, annual }),
    runRiskAgent({ profile, annual, recentNews: news }),
    runValuationAgent({ profile, annual }),
  ]);

  let dcf;
  try {
    dcf = runDCF(valuationAssumptions.assumptions);
  } catch {
    // Recover with seeded assumptions if the LLM returned an invalid set
    const last = annual[0];
    dcf = runDCF({
      ...valuationAssumptions.assumptions,
      wacc: Math.max(valuationAssumptions.assumptions.wacc, valuationAssumptions.assumptions.terminalGrowth + 0.03),
      sharesOutstandingCr: last?.sharesOutstandingCr ?? valuationAssumptions.assumptions.sharesOutstandingCr ?? 10,
    });
  }

  // Stage 2: synthesis agent
  const report = await runResearchAgent({
    profile,
    annual,
    peers,
    currentPrice: quote?.price,
    intrinsicValuePerShare: dcf.intrinsicValuePerShare,
  });

  return { profile, quote, annual, segments, peers, news, financialAnalysis, risk, valuationAssumptions, dcf, report };
}
