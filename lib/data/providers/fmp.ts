// Financial Modeling Prep provider. Falls back to mock for any field the API
// doesn't cover for Indian tickers, so the UI is never broken.

import type { MarketDataProvider } from "@/lib/data/types";
import { MockMarketDataProvider } from "@/lib/data/providers/mock";

const BASE = "https://financialmodelingprep.com/api/v3";

function key() {
  return process.env.FMP_API_KEY ?? "";
}

function fmpTicker(ticker: string) {
  // FMP convention for NSE: TICKER.NS
  return ticker.endsWith(".NS") || ticker.endsWith(".BO") ? ticker : `${ticker}.NS`;
}

async function get<T>(path: string): Promise<T | null> {
  if (!key()) return null;
  const url = `${BASE}${path}${path.includes("?") ? "&" : "?"}apikey=${key()}`;
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export class FMPMarketDataProvider implements MarketDataProvider {
  name = "fmp";
  private fallback = new MockMarketDataProvider();

  async searchCompanies(query: string) {
    const data = await get<any[]>(`/search?query=${encodeURIComponent(query)}&limit=12&exchange=NSE`);
    if (!data) return this.fallback.searchCompanies(query);
    return data.map((d) => ({
      ticker: String(d.symbol).replace(/\.(NS|BO)$/, ""),
      name: d.name,
      exchange: "NSE" as const,
    }));
  }

  async getProfile(ticker: string) {
    const data = await get<any[]>(`/profile/${fmpTicker(ticker)}`);
    if (!data?.[0]) return this.fallback.getProfile(ticker);
    const p = data[0];
    return {
      ticker: String(p.symbol).replace(/\.(NS|BO)$/, ""),
      name: p.companyName,
      sector: p.sector,
      industry: p.industry,
      description: p.description,
      website: p.website,
      marketCapCr: p.mktCap ? p.mktCap / 1e7 : undefined,
      exchange: "NSE" as const,
      currency: p.currency ?? "INR",
      country: p.country ?? "IN",
      logoUrl: p.image,
    };
  }

  async getQuote(ticker: string) {
    const data = await get<any[]>(`/quote/${fmpTicker(ticker)}`);
    if (!data?.[0]) return this.fallback.getQuote(ticker);
    const q = data[0];
    return {
      ticker,
      price: q.price,
      change: q.change,
      changePct: q.changesPercentage / 100,
      open: q.open,
      high: q.dayHigh,
      low: q.dayLow,
      prevClose: q.previousClose,
      volume: q.volume,
      asOf: new Date(q.timestamp * 1000),
    };
  }

  async getAnnualFinancials(ticker: string, years = 10) {
    const [income, cash, ratios] = await Promise.all([
      get<any[]>(`/income-statement/${fmpTicker(ticker)}?limit=${years}`),
      get<any[]>(`/cash-flow-statement/${fmpTicker(ticker)}?limit=${years}`),
      get<any[]>(`/ratios/${fmpTicker(ticker)}?limit=${years}`),
    ]);
    if (!income) return this.fallback.getAnnualFinancials(ticker, years);
    return income.map((row, i) => {
      const c = cash?.[i] ?? {};
      const r = ratios?.[i] ?? {};
      return {
        fiscalYear: Number(String(row.date).slice(0, 4)),
        endDate: row.date,
        revenueCr: row.revenue / 1e7,
        ebitdaCr: row.ebitda / 1e7,
        ebitCr: row.operatingIncome / 1e7,
        patCr: row.netIncome / 1e7,
        cfoCr: c.operatingCashFlow / 1e7,
        capexCr: c.capitalExpenditure / 1e7,
        fcfCr: c.freeCashFlow / 1e7,
        ebitdaMargin: row.ebitdaratio,
        patMargin: row.netIncomeRatio,
        eps: row.eps,
        pe: r.priceEarningsRatio,
        evEbitda: r.enterpriseValueMultiple,
        evSales: r.priceToSalesRatio,
        pb: r.priceToBookRatio,
        roce: r.returnOnCapitalEmployed,
        roe: r.returnOnEquity,
        debtToEquity: r.debtEquityRatio,
        interestCoverage: r.interestCoverage,
        dividendYield: r.dividendYield,
      };
    });
  }

  async getQuarterlyFinancials(ticker: string, quarters = 12) {
    const rows = await get<any[]>(`/income-statement/${fmpTicker(ticker)}?period=quarter&limit=${quarters}`);
    if (!rows) return this.fallback.getQuarterlyFinancials(ticker, quarters);
    return rows.map((row) => ({
      fiscalYear: Number(String(row.date).slice(0, 4)),
      fiscalQuarter: Number(row.period?.replace("Q", "")) || undefined,
      endDate: row.date,
      revenueCr: row.revenue / 1e7,
      ebitdaCr: row.ebitda / 1e7,
      patCr: row.netIncome / 1e7,
      ebitdaMargin: row.ebitdaratio,
      patMargin: row.netIncomeRatio,
      eps: row.eps,
    }));
  }

  async getRevenueSegments(ticker: string) {
    // FMP segment data is patchy for Indian tickers — fall back.
    return this.fallback.getRevenueSegments(ticker);
  }

  async getPeers(ticker: string) {
    const data = await get<any[]>(`/stock_peers?symbol=${fmpTicker(ticker)}`);
    if (!data?.[0]?.peersList) return this.fallback.getPeers(ticker);
    const peers: string[] = data[0].peersList;
    return Promise.all(
      peers.slice(0, 6).map(async (p) => {
        const profile = await this.getProfile(p.replace(/\.(NS|BO)$/, ""));
        return {
          ticker: p.replace(/\.(NS|BO)$/, ""),
          name: profile?.name ?? p,
          marketCapCr: profile?.marketCapCr,
        };
      }),
    );
  }

  async getNews(ticker: string, limit = 10) {
    const data = await get<any[]>(`/stock_news?tickers=${fmpTicker(ticker)}&limit=${limit}`);
    if (!data) return this.fallback.getNews(ticker, limit);
    return data.map((n) => ({
      headline: n.title,
      url: n.url,
      source: n.site,
      publishedAt: new Date(n.publishedDate),
      summary: n.text?.slice(0, 280),
    }));
  }

  async getMarketSnapshot() {
    return this.fallback.getMarketSnapshot();
  }

  // FMP doesn't expose concall transcripts on Indian tickers — fall back to
  // the deterministic synthetic summary so the comparison feature still works.
  getConcallSummary(ticker: string) {
    return this.fallback.getConcallSummary(ticker);
  }

  // NSE / BSE announcement feeds aren't covered by FMP — synthetic for now.
  // A real implementation would poll the exchange announcement APIs and run
  // the summariser agent on each new filing.
  getCorporateAnnouncements(opts?: Parameters<typeof this.fallback.getCorporateAnnouncements>[0]) {
    return this.fallback.getCorporateAnnouncements(opts);
  }
}
