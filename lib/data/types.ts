// Shared types for the market-data provider abstraction.

export type Exchange = "NSE" | "BSE";

export interface CompanyProfile {
  ticker: string;
  bseCode?: string;
  isin?: string;
  name: string;
  legalName?: string;
  sector?: string;
  industry?: string;
  description?: string;
  website?: string;
  marketCapCr?: number;
  exchange: Exchange;
  currency: string;
  country: string;
  logoUrl?: string;
  geographicMix?: { region: string; pct: number }[];
  businessModel?: string;
}

export interface PriceQuote {
  ticker: string;
  price: number;
  change: number;
  changePct: number;
  open?: number;
  high?: number;
  low?: number;
  prevClose?: number;
  volume?: number;
  asOf: Date;
}

export interface FinancialPoint {
  fiscalYear: number;
  fiscalQuarter?: number;
  endDate: string;
  revenueCr?: number;
  ebitdaCr?: number;
  ebitCr?: number;
  patCr?: number;
  cfoCr?: number;
  fcfCr?: number;
  capexCr?: number;
  debtCr?: number;
  cashCr?: number;
  netDebtCr?: number;
  equityCr?: number;
  assetsCr?: number;
  receivableDays?: number;
  payableDays?: number;
  inventoryDays?: number;
  roce?: number;
  roe?: number;
  debtToEquity?: number;
  interestCoverage?: number;
  ebitdaMargin?: number;
  patMargin?: number;
  eps?: number;
  bookValuePerShare?: number;
  sharesOutstandingCr?: number;
  pe?: number;
  evEbitda?: number;
  evSales?: number;
  pb?: number;
  dividendYield?: number;
}

export interface SegmentMix {
  fiscalYear: number;
  segments: { name: string; revenueCr: number; pctOfTotal: number }[];
}

export interface PeerSnapshot {
  ticker: string;
  name: string;
  marketCapCr?: number;
  pe?: number;
  evEbitda?: number;
  evSales?: number;
  pb?: number;
  roce?: number;
  roe?: number;
  revenueGrowth3y?: number;
  ebitdaMargin?: number;
}

export interface NewsHeadline {
  headline: string;
  url?: string;
  source?: string;
  publishedAt: Date;
  summary?: string;
  sentiment?: number;
}

export interface MarketDataProvider {
  name: string;

  searchCompanies(query: string): Promise<Pick<CompanyProfile, "ticker" | "name" | "exchange">[]>;
  getProfile(ticker: string): Promise<CompanyProfile | null>;
  getQuote(ticker: string): Promise<PriceQuote | null>;
  getAnnualFinancials(ticker: string, years?: number): Promise<FinancialPoint[]>;
  getQuarterlyFinancials(ticker: string, quarters?: number): Promise<FinancialPoint[]>;
  getRevenueSegments(ticker: string): Promise<SegmentMix[]>;
  getPeers(ticker: string): Promise<PeerSnapshot[]>;
  getNews(ticker: string, limit?: number): Promise<NewsHeadline[]>;
  getMarketSnapshot(): Promise<{ index: string; level: number; changePct: number }[]>;
}
