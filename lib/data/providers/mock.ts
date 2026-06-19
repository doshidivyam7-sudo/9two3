// Deterministic, realistic mock provider. Powers the app out-of-the-box
// without external API keys; used as a safe fallback by the real providers.

import type {
  CompanyProfile,
  FinancialPoint,
  MarketDataProvider,
  NewsHeadline,
  PeerSnapshot,
  PriceQuote,
  SegmentMix,
} from "@/lib/data/types";

interface SeedRow {
  ticker: string;
  name: string;
  sector: string;
  industry: string;
  description: string;
  website?: string;
  geographicMix?: { region: string; pct: number }[];
  businessModel?: string;
  peers: string[];
  // FY24 baseline (INR Cr)
  revenueFY24: number;
  ebitdaMarginFY24: number;
  patMarginFY24: number;
  growth: { revenue: number; ebitda: number; pat: number };
  roce: number;
  roe: number;
  debtCr: number;
  cashCr: number;
  shares: number; // crore
  price: number;
  segments: { name: string; pct: number }[];
}

const UNIVERSE: SeedRow[] = [
  {
    ticker: "RELIANCE",
    name: "Reliance Industries Limited",
    sector: "Energy",
    industry: "Oil & Gas / Conglomerate",
    description:
      "Reliance Industries is India's largest private-sector enterprise, with leadership across O2C (oil-to-chemicals), digital services (Jio), organised retail, and new energy.",
    website: "https://www.ril.com",
    geographicMix: [
      { region: "India", pct: 0.66 },
      { region: "Asia ex-India", pct: 0.14 },
      { region: "Americas", pct: 0.10 },
      { region: "Europe", pct: 0.10 },
    ],
    businessModel: "Diversified conglomerate spanning O2C, telecom & digital, retail, and renewables.",
    peers: ["ONGC", "BPCL", "IOC", "ADANIENT"],
    revenueFY24: 901064,
    ebitdaMarginFY24: 0.18,
    patMarginFY24: 0.085,
    growth: { revenue: 0.09, ebitda: 0.11, pat: 0.10 },
    roce: 0.105,
    roe: 0.092,
    debtCr: 312000,
    cashCr: 152000,
    shares: 676.6,
    price: 1320,
    segments: [
      { name: "O2C", pct: 0.55 },
      { name: "Jio (Digital)", pct: 0.18 },
      { name: "Retail", pct: 0.21 },
      { name: "Oil & Gas E&P", pct: 0.04 },
      { name: "Others", pct: 0.02 },
    ],
  },
  {
    ticker: "TCS",
    name: "Tata Consultancy Services",
    sector: "Information Technology",
    industry: "IT Services",
    description:
      "TCS is India's largest IT services firm, providing consulting, BPO, and tech outsourcing to Fortune 500 clients across BFSI, retail, life sciences, and communications.",
    website: "https://www.tcs.com",
    geographicMix: [
      { region: "North America", pct: 0.52 },
      { region: "Europe", pct: 0.31 },
      { region: "India", pct: 0.06 },
      { region: "Rest of World", pct: 0.11 },
    ],
    businessModel: "Global IT services with platform-led offerings (BaNCS, ignio) and large managed-services contracts.",
    peers: ["INFY", "WIPRO", "HCLTECH", "LTIM"],
    revenueFY24: 240893,
    ebitdaMarginFY24: 0.27,
    patMarginFY24: 0.193,
    growth: { revenue: 0.11, ebitda: 0.115, pat: 0.10 },
    roce: 0.51,
    roe: 0.46,
    debtCr: 0,
    cashCr: 65000,
    shares: 361.8,
    price: 4150,
    segments: [
      { name: "BFSI", pct: 0.31 },
      { name: "Consumer Business", pct: 0.16 },
      { name: "Communications & Media", pct: 0.16 },
      { name: "Manufacturing", pct: 0.10 },
      { name: "Life Sciences & Healthcare", pct: 0.11 },
      { name: "Technology & Services", pct: 0.09 },
      { name: "Regional Markets", pct: 0.07 },
    ],
  },
  {
    ticker: "INFY",
    name: "Infosys Limited",
    sector: "Information Technology",
    industry: "IT Services",
    description: "Infosys provides next-generation digital services and consulting to enterprises in 50+ countries.",
    peers: ["TCS", "WIPRO", "HCLTECH", "LTIM"],
    revenueFY24: 153670,
    ebitdaMarginFY24: 0.23,
    patMarginFY24: 0.171,
    growth: { revenue: 0.09, ebitda: 0.09, pat: 0.08 },
    roce: 0.38,
    roe: 0.32,
    debtCr: 0,
    cashCr: 38000,
    shares: 414,
    price: 1820,
    segments: [
      { name: "Financial Services", pct: 0.27 },
      { name: "Retail", pct: 0.14 },
      { name: "Communication", pct: 0.12 },
      { name: "Energy/Utilities", pct: 0.12 },
      { name: "Manufacturing", pct: 0.15 },
      { name: "Hi-Tech", pct: 0.08 },
      { name: "Life Sciences", pct: 0.07 },
      { name: "Others", pct: 0.05 },
    ],
  },
  {
    ticker: "HUDCO",
    name: "Housing & Urban Development Corporation",
    sector: "Financials",
    industry: "Public Sector NBFC",
    description:
      "HUDCO is a wholly Government-owned NBFC financing housing and urban infrastructure projects across States, ULBs, and parastatal agencies.",
    peers: ["IRFC", "PFC", "RECLTD", "NHB"],
    revenueFY24: 7949,
    ebitdaMarginFY24: 0.88,
    patMarginFY24: 0.27,
    growth: { revenue: 0.18, ebitda: 0.19, pat: 0.21 },
    roce: 0.108,
    roe: 0.118,
    debtCr: 79000,
    cashCr: 1800,
    shares: 200.2,
    price: 225,
    segments: [
      { name: "Urban Infrastructure Finance", pct: 0.73 },
      { name: "Housing Finance", pct: 0.27 },
    ],
  },
  {
    ticker: "INOXINDIA",
    name: "INOX India Limited",
    sector: "Industrials",
    industry: "Cryogenic Equipment",
    description:
      "INOX India is a leading manufacturer of cryogenic tanks, equipment, and turnkey systems for industrial gases, LNG, clean energy, and aerospace applications, exporting to 60+ countries.",
    peers: ["LINDEINDIA", "TGL", "ABSOFT", "PRAJIND"],
    revenueFY24: 1144,
    ebitdaMarginFY24: 0.235,
    patMarginFY24: 0.17,
    growth: { revenue: 0.22, ebitda: 0.24, pat: 0.26 },
    roce: 0.29,
    roe: 0.275,
    debtCr: 8,
    cashCr: 220,
    shares: 9.07,
    price: 1090,
    segments: [
      { name: "Industrial Gas", pct: 0.62 },
      { name: "LNG & Clean Energy", pct: 0.26 },
      { name: "Cryo Scientific", pct: 0.12 },
    ],
  },
  {
    ticker: "HDFCBANK",
    name: "HDFC Bank Limited",
    sector: "Financials",
    industry: "Private Bank",
    description: "HDFC Bank is India's largest private sector bank by assets, with a diversified retail, wholesale, and treasury franchise.",
    peers: ["ICICIBANK", "AXISBANK", "KOTAKBANK", "SBIN"],
    revenueFY24: 283649,
    ebitdaMarginFY24: 0.61,
    patMarginFY24: 0.21,
    growth: { revenue: 0.18, ebitda: 0.18, pat: 0.17 },
    roce: 0.094,
    roe: 0.171,
    debtCr: 0,
    cashCr: 230000,
    shares: 759.5,
    price: 1620,
    segments: [
      { name: "Retail Banking", pct: 0.55 },
      { name: "Wholesale Banking", pct: 0.27 },
      { name: "Treasury", pct: 0.13 },
      { name: "Other", pct: 0.05 },
    ],
  },
  {
    ticker: "BAJFINANCE",
    name: "Bajaj Finance Limited",
    sector: "Financials",
    industry: "NBFC — Consumer Finance",
    description: "Bajaj Finance is India's largest non-bank consumer lender across consumer durables, SME, mortgages, and rural finance.",
    peers: ["CHOLAFIN", "MUTHOOTFIN", "SHRIRAMFIN", "L&TFH"],
    revenueFY24: 54972,
    ebitdaMarginFY24: 0.66,
    patMarginFY24: 0.255,
    growth: { revenue: 0.32, ebitda: 0.31, pat: 0.27 },
    roce: 0.11,
    roe: 0.222,
    debtCr: 290000,
    cashCr: 11000,
    shares: 61.86,
    price: 7300,
    segments: [
      { name: "Consumer B2B / Durables", pct: 0.22 },
      { name: "Consumer B2C", pct: 0.30 },
      { name: "SME Lending", pct: 0.18 },
      { name: "Mortgages", pct: 0.20 },
      { name: "Commercial / Rural", pct: 0.10 },
    ],
  },
];

const BY_TICKER = new Map(UNIVERSE.map((r) => [r.ticker, r]));

function buildAnnual(row: SeedRow, years: number): FinancialPoint[] {
  const out: FinancialPoint[] = [];
  for (let i = years - 1; i >= 0; i--) {
    const fy = 2024 - i;
    const decay = Math.pow(1 + row.growth.revenue, -i);
    const decayEbitda = Math.pow(1 + row.growth.ebitda, -i);
    const decayPat = Math.pow(1 + row.growth.pat, -i);
    const revenue = row.revenueFY24 * decay;
    const ebitda = revenue * row.ebitdaMarginFY24 * (decayEbitda / decay);
    const pat = revenue * row.patMarginFY24 * (decayPat / decay);
    const cfo = pat * (1.0 + 0.05 * Math.cos(i));
    const capex = revenue * (row.sector === "Information Technology" ? 0.025 : 0.06);
    const fcf = cfo - capex;
    const debt = row.debtCr * Math.pow(1.04, -i);
    const cash = row.cashCr * Math.pow(1.05, -i);
    const equity = (pat / row.roe) * (1 - 0.04 * i);
    const assets = equity + debt + cash;
    out.push({
      fiscalYear: fy,
      endDate: `${fy}-03-31`,
      revenueCr: round(revenue),
      ebitdaCr: round(ebitda),
      ebitCr: round(ebitda * 0.85),
      patCr: round(pat),
      cfoCr: round(cfo),
      capexCr: round(capex),
      fcfCr: round(fcf),
      debtCr: round(debt),
      cashCr: round(cash),
      netDebtCr: round(debt - cash),
      equityCr: round(equity),
      assetsCr: round(assets),
      receivableDays: 45 + Math.sin(i) * 4,
      payableDays: 60 + Math.cos(i) * 5,
      inventoryDays: 35 + Math.cos(i * 1.3) * 4,
      roce: row.roce * (1 - 0.02 * i),
      roe: row.roe * (1 - 0.015 * i),
      debtToEquity: equity > 0 ? debt / equity : 0,
      interestCoverage: ebitda / Math.max(debt * 0.075, 1),
      ebitdaMargin: row.ebitdaMarginFY24 * (1 - 0.005 * i),
      patMargin: row.patMarginFY24 * (1 - 0.005 * i),
      eps: pat / row.shares,
      bookValuePerShare: equity / row.shares,
      sharesOutstandingCr: row.shares,
      pe: row.price / (pat / row.shares),
      evEbitda: (row.price * row.shares + debt - cash) / ebitda,
      evSales: (row.price * row.shares + debt - cash) / revenue,
      pb: row.price / (equity / row.shares),
      dividendYield: 0.012,
    });
  }
  return out;
}

function buildQuarterly(row: SeedRow, quarters: number): FinancialPoint[] {
  const annual = buildAnnual(row, Math.ceil(quarters / 4) + 1);
  const out: FinancialPoint[] = [];
  for (let i = 0; i < quarters; i++) {
    const fyIdx = annual.length - 1 - Math.floor(i / 4);
    const a = annual[Math.max(fyIdx, 0)];
    const q = 4 - (i % 4);
    const seasonality = [0.23, 0.24, 0.26, 0.27][q - 1];
    out.push({
      fiscalYear: a.fiscalYear,
      fiscalQuarter: q,
      endDate: `${a.fiscalYear}-${String(q * 3).padStart(2, "0")}-30`,
      revenueCr: round((a.revenueCr ?? 0) * seasonality),
      ebitdaCr: round((a.ebitdaCr ?? 0) * seasonality),
      patCr: round((a.patCr ?? 0) * seasonality),
      cfoCr: round((a.cfoCr ?? 0) * seasonality),
      fcfCr: round((a.fcfCr ?? 0) * seasonality),
      ebitdaMargin: a.ebitdaMargin,
      patMargin: a.patMargin,
      eps: ((a.patCr ?? 0) * seasonality) / row.shares,
    });
  }
  return out;
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

function newsFor(row: SeedRow): NewsHeadline[] {
  const now = Date.now();
  const day = 86400_000;
  const items: NewsHeadline[] = [
    {
      headline: `${row.name} reports Q4 results — revenue grows YoY`,
      source: "BSE Filings",
      publishedAt: new Date(now - 2 * day),
      summary: `Headline numbers in line with consensus; management commentary on order book strength.`,
      sentiment: 0.6,
    },
    {
      headline: `${row.name} announces capex plan in ${row.industry}`,
      source: "MoneyControl",
      publishedAt: new Date(now - 10 * day),
      summary: `Brownfield expansion expected to come online in next 18–24 months.`,
      sentiment: 0.3,
    },
    {
      headline: `Brokerage initiates coverage on ${row.ticker}`,
      source: "ET Markets",
      publishedAt: new Date(now - 25 * day),
      summary: `Cited structural tailwinds in the ${row.sector} sector.`,
      sentiment: 0.45,
    },
    {
      headline: `${row.industry} sector update: input cost trends`,
      source: "Mint",
      publishedAt: new Date(now - 40 * day),
      summary: `Margin watch as commodity prices fluctuate.`,
      sentiment: -0.1,
    },
  ];
  return items;
}

export class MockMarketDataProvider implements MarketDataProvider {
  name = "mock";

  async searchCompanies(query: string) {
    const q = query.toUpperCase();
    return UNIVERSE.filter((r) => r.ticker.includes(q) || r.name.toUpperCase().includes(q))
      .slice(0, 12)
      .map((r) => ({ ticker: r.ticker, name: r.name, exchange: "NSE" as const }));
  }

  async getProfile(ticker: string): Promise<CompanyProfile | null> {
    const r = BY_TICKER.get(ticker.toUpperCase());
    if (!r) return null;
    return {
      ticker: r.ticker,
      name: r.name,
      sector: r.sector,
      industry: r.industry,
      description: r.description,
      website: r.website,
      marketCapCr: r.price * r.shares,
      exchange: "NSE",
      currency: "INR",
      country: "IN",
      geographicMix: r.geographicMix,
      businessModel: r.businessModel,
    };
  }

  async getQuote(ticker: string): Promise<PriceQuote | null> {
    const r = BY_TICKER.get(ticker.toUpperCase());
    if (!r) return null;
    const jitter = ((Math.sin(Date.now() / 600_000 + r.ticker.length) + 1) / 2 - 0.5) * 0.02;
    const price = r.price * (1 + jitter);
    const prev = r.price * (1 + jitter - 0.005);
    return {
      ticker: r.ticker,
      price,
      change: price - prev,
      changePct: (price - prev) / prev,
      open: prev,
      high: price * 1.008,
      low: price * 0.992,
      prevClose: prev,
      volume: 1_500_000,
      asOf: new Date(),
    };
  }

  async getAnnualFinancials(ticker: string, years = 10) {
    const r = BY_TICKER.get(ticker.toUpperCase());
    if (!r) return [];
    return buildAnnual(r, years);
  }

  async getQuarterlyFinancials(ticker: string, quarters = 12) {
    const r = BY_TICKER.get(ticker.toUpperCase());
    if (!r) return [];
    return buildQuarterly(r, quarters);
  }

  async getRevenueSegments(ticker: string): Promise<SegmentMix[]> {
    const r = BY_TICKER.get(ticker.toUpperCase());
    if (!r) return [];
    return [2024, 2023, 2022].map((fy) => ({
      fiscalYear: fy,
      segments: r.segments.map((s) => ({
        name: s.name,
        revenueCr: round(r.revenueFY24 * Math.pow(1 + r.growth.revenue, fy - 2024) * s.pct),
        pctOfTotal: s.pct,
      })),
    }));
  }

  async getPeers(ticker: string): Promise<PeerSnapshot[]> {
    const r = BY_TICKER.get(ticker.toUpperCase());
    if (!r) return [];
    const peers = r.peers.map((p) => BY_TICKER.get(p)).filter(Boolean) as SeedRow[];
    // Synthesize peers we don't have hard data for using sector defaults
    const synthesized = r.peers
      .filter((p) => !BY_TICKER.has(p))
      .map((p) => ({
        ticker: p,
        name: p,
        marketCapCr: r.price * r.shares * (0.5 + Math.random() * 0.7),
        pe: 18 + Math.random() * 14,
        evEbitda: 10 + Math.random() * 8,
        evSales: 1.5 + Math.random() * 3,
        pb: 2 + Math.random() * 4,
        roce: r.roce * (0.7 + Math.random() * 0.5),
        roe: r.roe * (0.7 + Math.random() * 0.5),
        revenueGrowth3y: r.growth.revenue * (0.7 + Math.random() * 0.6),
        ebitdaMargin: r.ebitdaMarginFY24 * (0.7 + Math.random() * 0.5),
      }));
    const real = peers.map((p) => ({
      ticker: p.ticker,
      name: p.name,
      marketCapCr: p.price * p.shares,
      pe: p.price / ((p.revenueFY24 * p.patMarginFY24) / p.shares),
      evEbitda:
        (p.price * p.shares + p.debtCr - p.cashCr) / (p.revenueFY24 * p.ebitdaMarginFY24),
      evSales: (p.price * p.shares + p.debtCr - p.cashCr) / p.revenueFY24,
      pb: p.price / ((p.revenueFY24 * p.patMarginFY24) / p.roe / p.shares),
      roce: p.roce,
      roe: p.roe,
      revenueGrowth3y: p.growth.revenue,
      ebitdaMargin: p.ebitdaMarginFY24,
    }));
    return [...real, ...synthesized];
  }

  async getNews(ticker: string, limit = 10) {
    const r = BY_TICKER.get(ticker.toUpperCase());
    if (!r) return [];
    return newsFor(r).slice(0, limit);
  }

  async getMarketSnapshot() {
    return [
      { index: "NIFTY 50", level: 24850, changePct: 0.0042 },
      { index: "BANK NIFTY", level: 53120, changePct: -0.0011 },
      { index: "NIFTY MIDCAP 100", level: 58300, changePct: 0.0068 },
      { index: "NIFTY SMLCAP 100", level: 18460, changePct: 0.0091 },
      { index: "INDIA VIX", level: 13.4, changePct: -0.022 },
    ];
  }
}

export const MOCK_UNIVERSE = UNIVERSE;
