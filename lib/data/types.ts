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

export interface ConcallGuidanceItem {
  metric: string;
  value: string;
  horizon: string;
  confidence: "LOW" | "MEDIUM" | "HIGH";
}

export interface ConcallSegmentNote {
  segment: string;
  commentary: string;
  // Direction the segment is trending per management
  direction: "ACCELERATING" | "STABLE" | "DECELERATING";
}

export interface ConcallSummary {
  ticker: string;
  companyName: string;
  // e.g. "Q4 FY24", "Q1 FY25"
  period: string;
  callDate: Date;
  speakers: string[];
  // Structured guidance the comparison agent compares across companies
  revenueGuidance: ConcallGuidanceItem;
  ebitdaMarginGuidance: ConcallGuidanceItem;
  capexGuidance: ConcallGuidanceItem;
  orderBookCr?: number;
  orderBookGrowthYoY?: number;
  growthDrivers: string[];
  segmentCommentary: ConcallSegmentNote[];
  capitalAllocation: string[];
  risks: string[];
  redFlags: string[];
  notableQuotes: { speaker: string; quote: string; topic: string }[];
  // Aggregate sentiment: positive / cautious / negative
  tone: "POSITIVE" | "CAUTIOUS" | "NEGATIVE";
  // Provenance — "synthetic" when this is provider-baked sample data,
  // "uploaded" when derived from a user's uploaded transcript.
  source: "synthetic" | "uploaded" | "provider";
}

export type AnnouncementCategory =
  | "RESULTS"
  | "DIVIDEND"
  | "BOARD_MEETING"
  | "CAPITAL_RAISE"
  | "ALLOTMENT"
  | "MA"
  | "CREDIT_RATING"
  | "INSIDER_TRADE"
  | "CAPEX"
  | "ORDER_WIN"
  | "REGULATORY"
  | "MANAGEMENT_CHANGE"
  | "OTHER";

export interface CorporateAnnouncement {
  id: string;
  ticker: string;
  companyName: string;
  category: AnnouncementCategory;
  headline: string;
  // Up to 3 sentences — what an analyst would jot in their morning notes.
  summary: string;
  announcedAt: Date;
  source: "NSE" | "BSE" | "SEBI" | "Company" | "Other";
  url?: string;
  // Materiality flag — how meaningfully this should move the thesis.
  impact: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  // Whether the impact rises to "must read for holders" priority.
  isMaterial: boolean;
}

export interface MarketIndex {
  index: string;
  // ISO-ish group used by the UI to lay out top-row + sector strip.
  group: "BROAD" | "SECTOR" | "VOLATILITY";
  level: number;
  changePct: number;
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
  getMarketSnapshot(): Promise<MarketIndex[]>;
  getConcallSummary(ticker: string): Promise<ConcallSummary | null>;
  // Continually-tracked corporate announcements. Pass `ticker` for a single
  // company; omit for a global feed across the universe.
  getCorporateAnnouncements(opts?: { ticker?: string; limit?: number; category?: AnnouncementCategory }): Promise<CorporateAnnouncement[]>;
}
