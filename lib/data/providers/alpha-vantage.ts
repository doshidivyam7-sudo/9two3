import type { MarketDataProvider } from "@/lib/data/types";
import { MockMarketDataProvider } from "@/lib/data/providers/mock";

const BASE = "https://www.alphavantage.co/query";

function key() {
  return process.env.ALPHA_VANTAGE_API_KEY ?? "";
}

async function get<T>(params: Record<string, string>): Promise<T | null> {
  if (!key()) return null;
  const url = new URL(BASE);
  Object.entries({ ...params, apikey: key() }).forEach(([k, v]) => url.searchParams.set(k, v));
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function avTicker(ticker: string) {
  return ticker.includes(":") ? ticker : `NSE:${ticker}`;
}

export class AlphaVantageProvider implements MarketDataProvider {
  name = "alphavantage";
  private fallback = new MockMarketDataProvider();

  searchCompanies(q: string) {
    return this.fallback.searchCompanies(q);
  }

  async getProfile(ticker: string) {
    const data = await get<any>({ function: "OVERVIEW", symbol: avTicker(ticker) });
    if (!data?.Name) return this.fallback.getProfile(ticker);
    return {
      ticker,
      name: data.Name,
      sector: data.Sector,
      industry: data.Industry,
      description: data.Description,
      website: data.OfficialSite,
      marketCapCr: Number(data.MarketCapitalization) / 1e7 || undefined,
      exchange: "NSE" as const,
      currency: data.Currency ?? "INR",
      country: data.Country ?? "IN",
    };
  }

  async getQuote(ticker: string) {
    const data = await get<any>({ function: "GLOBAL_QUOTE", symbol: avTicker(ticker) });
    const q = data?.["Global Quote"];
    if (!q) return this.fallback.getQuote(ticker);
    const price = Number(q["05. price"]);
    const prev = Number(q["08. previous close"]);
    return {
      ticker,
      price,
      change: price - prev,
      changePct: prev ? (price - prev) / prev : 0,
      open: Number(q["02. open"]),
      high: Number(q["03. high"]),
      low: Number(q["04. low"]),
      prevClose: prev,
      volume: Number(q["06. volume"]),
      asOf: new Date(),
    };
  }

  async getAnnualFinancials(ticker: string, years = 10) {
    const [income, cash] = await Promise.all([
      get<any>({ function: "INCOME_STATEMENT", symbol: avTicker(ticker) }),
      get<any>({ function: "CASH_FLOW", symbol: avTicker(ticker) }),
    ]);
    if (!income?.annualReports) return this.fallback.getAnnualFinancials(ticker, years);
    return income.annualReports.slice(0, years).map((row: any, i: number) => {
      const c = cash?.annualReports?.[i] ?? {};
      const rev = Number(row.totalRevenue);
      const ebitda = Number(row.ebitda);
      const pat = Number(row.netIncome);
      return {
        fiscalYear: Number(row.fiscalDateEnding.slice(0, 4)),
        endDate: row.fiscalDateEnding,
        revenueCr: rev / 1e7,
        ebitdaCr: ebitda / 1e7,
        ebitCr: Number(row.operatingIncome) / 1e7,
        patCr: pat / 1e7,
        cfoCr: Number(c.operatingCashflow) / 1e7,
        capexCr: Number(c.capitalExpenditures) / 1e7,
        fcfCr: (Number(c.operatingCashflow) - Number(c.capitalExpenditures)) / 1e7,
        ebitdaMargin: rev ? ebitda / rev : undefined,
        patMargin: rev ? pat / rev : undefined,
      };
    });
  }

  getQuarterlyFinancials(t: string, q?: number) {
    return this.fallback.getQuarterlyFinancials(t, q);
  }
  getRevenueSegments(t: string) {
    return this.fallback.getRevenueSegments(t);
  }
  getPeers(t: string) {
    return this.fallback.getPeers(t);
  }
  getNews(t: string, l?: number) {
    return this.fallback.getNews(t, l);
  }
  getMarketSnapshot() {
    return this.fallback.getMarketSnapshot();
  }
}
