// Deterministic, realistic mock provider. Powers the app out-of-the-box
// without external API keys; used as a safe fallback by the real providers.

import type {
  CompanyProfile,
  ConcallSummary,
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
  // FY24 baseline (INR Cr) — matches published annual report
  revenueFY24: number;
  ebitdaMarginFY24: number;
  patMarginFY24: number;
  // Forward-looking growth used by valuation defaults & concall guidance
  growth: { revenue: number; ebitda: number; pat: number };
  // Realised 9y revenue CAGR (FY15 → FY24) — used to back-build the 10y series
  // so historical numbers approximate published reports. Falls back to
  // growth.revenue if absent (e.g. for synthesised peers).
  historicalCagr?: number;
  roce: number;
  roe: number;
  debtCr: number;
  cashCr: number;
  shares: number; // crore — post all corporate actions (bonus/split)
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
    // FY24 consolidated revenue from operations ₹901,064 Cr; EBITDA ₹178,677 Cr → 19.8%
    // (published margin including other income); PAT ₹79,020 Cr → 8.8%.
    revenueFY24: 901064,
    ebitdaMarginFY24: 0.198,
    patMarginFY24: 0.088,
    growth: { revenue: 0.085, ebitda: 0.095, pat: 0.09 },
    historicalCagr: 0.116, // FY15 ₹329,904 Cr → FY24 ₹901,064 Cr
    roce: 0.105,
    roe: 0.092,
    debtCr: 312000,
    cashCr: 152000,
    // Post 1:1 bonus (record date 28 Oct 2024) — current share count
    shares: 1353.4,
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
    // FY24 actuals: Revenue ₹240,893 Cr, EBITDA ₹64,949 Cr (27%), PAT ₹46,099 Cr (19.1%)
    revenueFY24: 240893,
    ebitdaMarginFY24: 0.269,
    patMarginFY24: 0.191,
    growth: { revenue: 0.09, ebitda: 0.09, pat: 0.08 },
    historicalCagr: 0.108, // FY15 ₹94,648 Cr → FY24 ₹240,893 Cr
    roce: 0.57,
    roe: 0.47,
    debtCr: 0,
    cashCr: 65000,
    shares: 361.81,
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
    // FY24 actuals: Revenue ₹153,670 Cr, EBITDA ₹36,754 Cr (~23.9%), PAT ₹26,233 Cr (17.1%)
    revenueFY24: 153670,
    ebitdaMarginFY24: 0.239,
    patMarginFY24: 0.171,
    growth: { revenue: 0.075, ebitda: 0.08, pat: 0.075 },
    historicalCagr: 0.124, // FY15 ₹53,319 Cr → FY24 ₹153,670 Cr
    roce: 0.36,
    roe: 0.30,
    debtCr: 0,
    cashCr: 38000,
    shares: 414.15,
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
    // FY24 actuals: Total income ₹7,949 Cr, PAT ₹2,117 Cr → 26.6%. For an NBFC
    // the "EBITDA margin" proxy here is NII / Total income (~85%).
    revenueFY24: 7949,
    ebitdaMarginFY24: 0.85,
    patMarginFY24: 0.266,
    growth: { revenue: 0.18, ebitda: 0.19, pat: 0.20 },
    historicalCagr: 0.105, // FY15 ₹3,165 Cr → FY24 ₹7,949 Cr
    roce: 0.108,
    roe: 0.117,
    debtCr: 79000,
    cashCr: 1800,
    shares: 200.19,
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
    // FY24 actuals (full year post Dec 2023 IPO): Revenue ₹1,196.5 Cr, EBITDA ₹277.9 Cr (23.2%),
    // PAT ₹162.4 Cr (13.6%). ROCE ~28%, ROE ~21% (lower than ROCE post-IPO due to bumped equity).
    revenueFY24: 1196,
    ebitdaMarginFY24: 0.232,
    patMarginFY24: 0.136,
    growth: { revenue: 0.22, ebitda: 0.24, pat: 0.25 },
    historicalCagr: 0.17, // FY16 ~₹290 Cr → FY24 ₹1,196 Cr
    roce: 0.28,
    roe: 0.21,
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
    // FY24 actuals (post HDFC Ltd merger): Interest income ₹258,340 Cr + Other income ₹49,241 Cr
    // → "Revenue" proxy ₹283,649 Cr (interest + non-interest operating income). PPOP
    // ₹109,648 Cr ≈ 39% — call it 40% as the EBITDA proxy. PAT ₹60,812 Cr → 21.4%.
    revenueFY24: 283649,
    ebitdaMarginFY24: 0.40,
    patMarginFY24: 0.214,
    growth: { revenue: 0.16, ebitda: 0.16, pat: 0.15 },
    historicalCagr: 0.193, // FY15 ₹57,466 Cr → FY24 ₹283,649 Cr (distorted by merger one-off in FY24)
    roce: 0.085,
    roe: 0.171,
    debtCr: 0,
    cashCr: 230000,
    shares: 759.69,
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
    // FY24 actuals: Total income ₹54,972 Cr, PPOP ₹35,500 Cr (~65%), PAT ₹14,451 Cr (26.3%).
    // ROE 22.1%. AUM grew 34% YoY to ₹3.30 L Cr.
    revenueFY24: 54972,
    ebitdaMarginFY24: 0.646,
    patMarginFY24: 0.263,
    growth: { revenue: 0.26, ebitda: 0.26, pat: 0.24 },
    historicalCagr: 0.336, // FY15 ₹4,073 Cr → FY24 ₹54,972 Cr
    roce: 0.108,
    roe: 0.221,
    debtCr: 290000,
    cashCr: 11000,
    shares: 61.94,
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

// Every ticker referenced anywhere in the universe → its sector. This lets us
// synthesise reasonable concall summaries for the peers of seeded companies
// even when those peers don't have their own SeedRow.
const SECTOR_BY_TICKER = new Map<string, string>();
UNIVERSE.forEach((r) => {
  SECTOR_BY_TICKER.set(r.ticker, r.sector);
  r.peers.forEach((p) => {
    if (!SECTOR_BY_TICKER.has(p)) SECTOR_BY_TICKER.set(p, r.sector);
  });
});

// Anchor year — FY24 is the year for which seed values are published actuals.
// Latest reported year — FY26 (today is mid-Jun 2026, Q4 FY26 results are out).
const BASE_FY = 2024;
const LATEST_FY = 2026;
const LATEST_QUARTER_END = new Date(Date.UTC(2026, 2, 31)); // 31 Mar 2026 = Q4 FY26 close

function buildAnnual(row: SeedRow, years: number): FinancialPoint[] {
  // Newest-first ordering — consumers expect annual[0] = latest FY (FY26).
  // - FY25-FY26: project forward from FY24 baseline using forward growth.
  // - FY24 and earlier: back-build using realised historicalCagr so the
  //   reported 10y series approximates each company's actual published history.
  const histGrowth = row.historicalCagr ?? row.growth.revenue;
  const fwdGrowth = row.growth.revenue;
  const fwdEbitdaG = row.growth.ebitda;
  const fwdPatG = row.growth.pat;
  const out: FinancialPoint[] = [];
  for (let i = 0; i < years; i++) {
    const fy = LATEST_FY - i;
    const yearsFromBase = fy - BASE_FY; // +2 = FY26, 0 = FY24, -8 = FY16
    const decay = yearsFromBase >= 0
      ? Math.pow(1 + fwdGrowth, yearsFromBase)
      : Math.pow(1 + histGrowth, yearsFromBase);
    // EBITDA / PAT compound at their own forward rates above FY24 — captures
    // operating-leverage assumed in management guidance.
    const ebitdaDecay = yearsFromBase >= 0
      ? Math.pow(1 + fwdEbitdaG, yearsFromBase) / decay
      : Math.max(0, 1 - 0.012 * Math.abs(yearsFromBase));
    const patDecay = yearsFromBase >= 0
      ? Math.pow(1 + fwdPatG, yearsFromBase) / decay
      : Math.max(0, 1 - 0.012 * Math.abs(yearsFromBase));
    const revenue = row.revenueFY24 * decay;
    const ebitda = revenue * row.ebitdaMarginFY24 * ebitdaDecay;
    const pat = revenue * row.patMarginFY24 * patDecay;
    // Positional index for cyclical noise — non-negative regardless of direction
    const idx = Math.abs(yearsFromBase);
    const cfo = pat * (1.0 + 0.05 * Math.cos(idx));
    const capex = revenue * (row.sector === "Information Technology" ? 0.025 : 0.06);
    const fcf = cfo - capex;
    // Debt and cash anchored on FY24 baseline — compound forward, decay backward.
    const debt = row.debtCr * Math.pow(1.04, yearsFromBase);
    const cash = row.cashCr * Math.pow(1.05, yearsFromBase);
    // Equity: solve from PAT / ROE; ROE was modestly lower in earlier years.
    const equity = pat / Math.max(row.roe * (1 + 0.015 * yearsFromBase * -1), 0.05);
    const assets = equity + debt + cash;
    // Effective margins drift around FY24 baseline (slight scale leverage forward).
    const effEbitdaMargin = ebitda / revenue;
    const effPatMargin = pat / revenue;
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
      receivableDays: 45 + Math.sin(idx) * 4,
      payableDays: 60 + Math.cos(idx) * 5,
      inventoryDays: 35 + Math.cos(idx * 1.3) * 4,
      roce: row.roce * (1 + 0.015 * yearsFromBase),
      roe: row.roe * (1 + 0.012 * yearsFromBase),
      debtToEquity: equity > 0 ? debt / equity : 0,
      interestCoverage: ebitda / Math.max(debt * 0.075, 1),
      ebitdaMargin: effEbitdaMargin,
      patMargin: effPatMargin,
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

// Indian FY runs Apr-Mar. Q1 ends Jun 30, Q2 Sep 30, Q3 Dec 31, Q4 Mar 31.
function quarterEndDate(fy: number, q: number): string {
  if (q === 1) return `${fy - 1}-06-30`;
  if (q === 2) return `${fy - 1}-09-30`;
  if (q === 3) return `${fy - 1}-12-31`;
  return `${fy}-03-31`;
}

function buildQuarterly(row: SeedRow, quarters: number): FinancialPoint[] {
  // annual is newest-first; index 0 = latest FY (FY26). Walk backward by quarter
  // from Q4 FY26 → Q3 FY26 → … → Q1 FY(26-N+1).
  const annual = buildAnnual(row, Math.ceil(quarters / 4) + 1);
  const out: FinancialPoint[] = [];
  for (let i = 0; i < quarters; i++) {
    const fyIdx = Math.min(Math.floor(i / 4), annual.length - 1);
    const a = annual[fyIdx];
    const q = 4 - (i % 4);
    const seasonality = [0.23, 0.24, 0.26, 0.27][q - 1];
    out.push({
      fiscalYear: a.fiscalYear,
      fiscalQuarter: q,
      endDate: quarterEndDate(a.fiscalYear, q),
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

// Sector-specific concall flavour text — picked up by the synthetic builder
// so each company's summary sounds plausibly different from its peers.
const SECTOR_PROFILES: Record<
  string,
  {
    capexNarrative: (intensity: number) => string;
    orderBookMultiple: number; // order book = revenue * this
    sectorRisks: string[];
    capAllocVerbs: string[];
    speakerTitles: [string, string];
    callQuirks: string[];
  }
> = {
  Energy: {
    capexNarrative: (i) => `Heavy ongoing brownfield capex (~₹${Math.round(i)} kCr/yr) for petchem & new-energy build-out.`,
    orderBookMultiple: 0,
    sectorRisks: ["Crude price volatility", "Refining crack spread compression", "Telecom ARPU stagnation"],
    capAllocVerbs: ["Reinvesting cash flows into new-energy verticals", "Maintaining ~30% payout to deleveraging"],
    speakerTitles: ["Chairman & MD", "Group CFO"],
    callQuirks: ["Reiterated NewCo timelines", "Highlighted hyperscaler cloud wins for Jio Platforms"],
  },
  "Information Technology": {
    capexNarrative: (i) => `Capex stays modest (~${(i * 100).toFixed(1)}% of revenue); platform investments via opex.`,
    orderBookMultiple: 1.05,
    sectorRisks: ["Discretionary spend pause in BFSI / Hi-Tech verticals", "Pricing pressure on managed services", "Wage inflation in onshore mix"],
    capAllocVerbs: ["Returning >100% of FCF via buybacks + dividends", "Tuck-in M&A in cloud / AI consulting"],
    speakerTitles: ["CEO & MD", "CFO"],
    callQuirks: ["TCV in line with prior quarter", "Headcount trimming offset by utilisation gains"],
  },
  Financials: {
    capexNarrative: () => `Capex immaterial; investment is in branch network, distribution and tech stack.`,
    orderBookMultiple: 0,
    sectorRisks: ["Net interest margin compression as repo rate cycles", "Asset-quality slippage in unsecured retail", "Liquidity / ALM mismatch"],
    capAllocVerbs: ["Building Tier-1 buffer for growth", "Calibrated dividend within RBI norms"],
    speakerTitles: ["MD & CEO", "CFO"],
    callQuirks: ["Credit cost guidance held", "Watching unsecured stress in early bucket flows"],
  },
  Industrials: {
    capexNarrative: (i) => `Greenfield + capacity de-bottlenecking; ₹${Math.round(i)} Cr over next 18 months.`,
    orderBookMultiple: 1.6,
    sectorRisks: ["Working-capital stretch on large EPC orders", "Raw-material (steel/SS) price volatility", "Export demand cyclicality"],
    capAllocVerbs: ["Funding capex from internal accruals", "Maintaining net-cash balance sheet"],
    speakerTitles: ["MD", "CFO"],
    callQuirks: ["Cited export wins in LNG / industrial gas", "Reiterated ROCE > 25% through cycle"],
  },
};

const DEFAULT_SECTOR = SECTOR_PROFILES.Industrials;

function concallSummaryFor(row: SeedRow): ConcallSummary {
  const profile = SECTOR_PROFILES[row.sector] ?? DEFAULT_SECTOR;
  // Project FY24 baseline → FY26 (the year just reported) using forward growth.
  const yearsForward = LATEST_FY - BASE_FY; // 2
  const revenueFY26 = row.revenueFY24 * Math.pow(1 + row.growth.revenue, yearsForward);
  const ebitdaMarginFY26 = row.ebitdaMarginFY24 * (1 + 0.01 * yearsForward); // mild operating leverage
  const revGrowthPct = row.growth.revenue * 100;
  const ebitdaMarginPct = ebitdaMarginFY26 * 100;
  const sectorCapexIntensity = row.sector === "Information Technology" ? 0.025 : 0.06;
  const capexCr = revenueFY26 * sectorCapexIntensity;
  const orderBookCr = profile.orderBookMultiple ? Math.round(revenueFY26 * profile.orderBookMultiple) : undefined;

  const segments: ConcallSegmentNote[] = row.segments.map((s, i) => ({
    segment: s.name,
    commentary:
      i === 0
        ? `Largest contributor; demand momentum holding into next quarter, pricing stable.`
        : i === row.segments.length - 1
        ? `Smaller piece; selective bidding to protect margin profile.`
        : `Steady volume growth, mix improving toward higher-margin offerings.`,
    direction:
      i === 0 ? "ACCELERATING" : i === row.segments.length - 1 ? "DECELERATING" : "STABLE",
  }));

  const drivers = [
    `${row.segments[0].name} ramping with order conversion`,
    `Premiumisation in ${row.segments[Math.min(1, row.segments.length - 1)].name}`,
    row.sector === "Information Technology"
      ? "GenAI-led deals contributing to TCV"
      : `Exports / India capex cycle tailwind`,
  ];

  const quotes = [
    {
      speaker: profile.speakerTitles[0],
      quote:
        row.sector === "Financials"
          ? "We see no need to revise our credit cost guidance for the full year despite some early-bucket noise in unsecured."
          : row.sector === "Information Technology"
          ? "We exit Q4 with the strongest deal pipeline in eight quarters and a TCV book that supports our growth aspiration into the next fiscal."
          : `${row.name.split(" ")[0]} is well-positioned to deliver another year of >${Math.round(revGrowthPct)}% revenue growth at sustained margins.`,
      topic: "Outlook",
    },
    {
      speaker: profile.speakerTitles[1],
      quote:
        row.sector === "Financials"
          ? "Our incremental cost of funds has stabilised and we expect NIM to find a floor over the next two quarters."
          : `We expect EBITDA margins to remain in the ${(ebitdaMarginPct - 0.5).toFixed(1)}–${(ebitdaMarginPct + 0.5).toFixed(1)}% band through FY27.`,
      topic: "Margins",
    },
  ];

  return {
    ticker: row.ticker,
    companyName: row.name,
    period: `Q4 FY${String(LATEST_FY).slice(2)}`,
    callDate: new Date(Date.UTC(LATEST_FY, 4, 8)), // ~8 May post Q4 results
    speakers: [profile.speakerTitles[0], profile.speakerTitles[1], "Head of IR"],
    revenueGuidance: {
      metric: "Revenue growth",
      value: `${revGrowthPct.toFixed(0)}–${(revGrowthPct + 2).toFixed(0)}% YoY`,
      horizon: `FY${String(LATEST_FY + 1).slice(2)}E`,
      confidence: row.growth.revenue >= 0.18 ? "HIGH" : row.growth.revenue >= 0.1 ? "MEDIUM" : "LOW",
    },
    ebitdaMarginGuidance: {
      metric: "EBITDA margin",
      value: `${(ebitdaMarginPct - 0.5).toFixed(1)}–${(ebitdaMarginPct + 0.5).toFixed(1)}%`,
      horizon: `FY${String(LATEST_FY + 1).slice(2)}E`,
      confidence: "MEDIUM",
    },
    capexGuidance: {
      metric: "Capex",
      value: row.sector === "Financials"
        ? `~₹${Math.round(revenueFY26 * 0.02).toLocaleString("en-IN")} Cr (tech + distribution)`
        : `~₹${Math.round(capexCr).toLocaleString("en-IN")} Cr`,
      horizon: `FY${String(LATEST_FY + 1).slice(2)}E`,
      confidence: "MEDIUM",
    },
    orderBookCr,
    orderBookGrowthYoY: orderBookCr ? row.growth.revenue * 1.1 : undefined,
    growthDrivers: drivers,
    segmentCommentary: segments,
    capitalAllocation: profile.capAllocVerbs,
    risks: profile.sectorRisks,
    redFlags: row.growth.revenue < 0.1
      ? [`Single-digit growth guidance below trend — watch demand reset`]
      : [],
    notableQuotes: quotes,
    tone: row.growth.revenue >= 0.18 ? "POSITIVE" : row.growth.revenue >= 0.1 ? "CAUTIOUS" : "NEGATIVE",
    source: "synthetic",
  };
}

// Synthesise a concall summary for a peer ticker that doesn't have a full
// SeedRow — uses the sector profile + deterministic per-ticker variation
// (hash of the ticker) so each peer reads distinct but plausible.
function syntheticPeerConcall(ticker: string, sector: string): ConcallSummary {
  const profile = SECTOR_PROFILES[sector] ?? DEFAULT_SECTOR;
  // Stable pseudo-random based on ticker so values don't change per request
  const h = [...ticker].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 0);
  const rand = (lo: number, hi: number) => lo + ((h % 1000) / 1000) * (hi - lo);

  const sectorBaseGrowth: Record<string, number> = {
    Energy: 0.08,
    "Information Technology": 0.09,
    Financials: 0.16,
    Industrials: 0.18,
  };
  const baseGrowth = sectorBaseGrowth[sector] ?? 0.12;
  const growth = baseGrowth + (rand(0, 6) - 3) / 100; // ±3pp
  const ebitdaMargin =
    sector === "Information Technology"
      ? 0.24 + rand(-0.02, 0.03)
      : sector === "Financials"
      ? 0.6 + rand(-0.05, 0.05)
      : sector === "Energy"
      ? 0.17 + rand(-0.02, 0.03)
      : 0.18 + rand(-0.03, 0.05);

  const revenueGuidanceValue = `${(growth * 100).toFixed(0)}–${(growth * 100 + 2).toFixed(0)}% YoY`;
  const ebitdaBand = `${((ebitdaMargin - 0.005) * 100).toFixed(1)}–${((ebitdaMargin + 0.005) * 100).toFixed(1)}%`;

  return {
    ticker,
    companyName: ticker,
    period: `Q4 FY${String(LATEST_FY).slice(2)}`,
    callDate: new Date(Date.UTC(LATEST_FY, 4, 8)),
    speakers: [profile.speakerTitles[0], profile.speakerTitles[1]],
    revenueGuidance: {
      metric: "Revenue growth",
      value: revenueGuidanceValue,
      horizon: `FY${String(LATEST_FY + 1).slice(2)}E`,
      confidence: growth >= 0.18 ? "HIGH" : growth >= 0.1 ? "MEDIUM" : "LOW",
    },
    ebitdaMarginGuidance: {
      metric: "EBITDA margin",
      value: ebitdaBand,
      horizon: `FY${String(LATEST_FY + 1).slice(2)}E`,
      confidence: "MEDIUM",
    },
    capexGuidance: {
      metric: "Capex",
      value:
        sector === "Financials"
          ? "Immaterial (tech / distribution)"
          : `~${(growth * 100 * 0.6).toFixed(0)}% of revenue`,
      horizon: `FY${String(LATEST_FY + 1).slice(2)}E`,
      confidence: "MEDIUM",
    },
    orderBookCr: profile.orderBookMultiple ? Math.round(rand(800, 4000)) : undefined,
    orderBookGrowthYoY: profile.orderBookMultiple ? growth * 1.05 : undefined,
    growthDrivers:
      sector === "Information Technology"
        ? ["BFSI ramp-up post pause", "GenAI-led deal wins", "Cloud / data modernisation"]
        : sector === "Financials"
        ? ["Retail loan book growth", "NIM expansion as rates settle", "Distribution-led customer adds"]
        : sector === "Energy"
        ? ["O2C demand recovery", "New-energy capex monetisation", "Retail / digital cross-sell"]
        : ["Order book conversion", "Export-led demand", "Manufacturing capex tailwind"],
    segmentCommentary: [],
    capitalAllocation: profile.capAllocVerbs,
    risks: profile.sectorRisks,
    redFlags: growth < 0.1 ? ["Single-digit growth guidance is below our long-term trend"] : [],
    notableQuotes: [
      {
        speaker: profile.speakerTitles[0],
        quote: `We see ${(growth * 100).toFixed(0)}% growth as the right base for FY${String(LATEST_FY + 1).slice(2)} with EBITDA margins broadly in line.`,
        topic: "Outlook",
      },
    ],
    tone: growth >= 0.18 ? "POSITIVE" : growth >= 0.1 ? "CAUTIOUS" : "NEGATIVE",
    source: "synthetic",
  };
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
    const fwdGrowth = r.growth.revenue;
    const histGrowth = r.historicalCagr ?? r.growth.revenue;
    return [LATEST_FY, LATEST_FY - 1, BASE_FY].map((fy) => {
      const yearsFromBase = fy - BASE_FY;
      const decay = yearsFromBase >= 0
        ? Math.pow(1 + fwdGrowth, yearsFromBase)
        : Math.pow(1 + histGrowth, yearsFromBase);
      const total = r.revenueFY24 * decay;
      return {
        fiscalYear: fy,
        segments: r.segments.map((s) => ({
          name: s.name,
          revenueCr: round(total * s.pct),
          pctOfTotal: s.pct,
        })),
      };
    });
  }

  async getPeers(ticker: string): Promise<PeerSnapshot[]> {
    const r = BY_TICKER.get(ticker.toUpperCase());
    if (!r) return [];
    const peers = r.peers.map((p) => BY_TICKER.get(p)).filter(Boolean) as SeedRow[];
    // Synthesise peers we don't have hard data for using sector defaults +
    // deterministic per-ticker hash so multiples don't change across requests.
    const synthesized = r.peers
      .filter((p) => !BY_TICKER.has(p))
      .map((p) => {
        const h = [...p].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 0);
        // Three independent pseudo-random draws in [0, 1) from the ticker hash.
        const u = [(h % 1009) / 1009, ((h >> 7) % 1013) / 1013, ((h >> 13) % 1019) / 1019];
        return {
          ticker: p,
          name: p,
          marketCapCr: r.price * r.shares * (0.4 + u[0] * 0.9),
          pe: 16 + u[1] * 16,
          evEbitda: 9 + u[2] * 9,
          evSales: 1.2 + u[0] * 3,
          pb: 1.8 + u[1] * 3.5,
          roce: r.roce * (0.7 + u[2] * 0.5),
          roe: r.roe * (0.7 + u[0] * 0.5),
          revenueGrowth3y: (r.historicalCagr ?? r.growth.revenue) * (0.7 + u[1] * 0.6),
          ebitdaMargin: r.ebitdaMarginFY24 * (0.75 + u[2] * 0.4),
        };
      });
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
    // Plausible mid-FY27 levels (today ≈ 20 Jun 2026)
    return [
      { index: "NIFTY 50", level: 27820, changePct: 0.0038 },
      { index: "BANK NIFTY", level: 61450, changePct: -0.0014 },
      { index: "NIFTY MIDCAP 100", level: 66900, changePct: 0.0061 },
      { index: "NIFTY SMLCAP 100", level: 21680, changePct: 0.0084 },
      { index: "INDIA VIX", level: 14.1, changePct: -0.018 },
    ];
  }

  async getConcallSummary(ticker: string): Promise<ConcallSummary | null> {
    const T = ticker.toUpperCase();
    const r = BY_TICKER.get(T);
    if (r) return concallSummaryFor(r);
    // Peer of a seeded company without its own SeedRow — synthesise from sector.
    const sector = SECTOR_BY_TICKER.get(T);
    if (sector) return syntheticPeerConcall(T, sector);
    return null;
  }
}

export const MOCK_UNIVERSE = UNIVERSE;
