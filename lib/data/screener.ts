// Screener data + filter engine. Builds a universe-level snapshot once from
// the existing market-data provider, then runs in-memory filter/sort.
// For real production with thousands of companies this would move into a
// materialised view or warehouse table; the surface area here is intentionally
// shaped to match.

import { marketData } from "@/lib/data";
import type { CompanyProfile, FinancialPoint } from "@/lib/data/types";
import { cagr } from "@/lib/format";
import { MOCK_UNIVERSE } from "@/lib/data/providers/mock";

export interface ScreenerRow {
  ticker: string;
  name: string;
  sector: string;
  industry: string;
  marketCapCr: number;
  price: number;
  // Latest FY (FY26)
  revenueCr: number;
  ebitdaCr: number;
  patCr: number;
  fcfCr: number | null;
  ebitdaMargin: number;
  patMargin: number;
  roce: number;
  roe: number;
  debtToEquity: number;
  netDebtCr: number;
  // Multiples
  pe: number;
  evEbitda: number;
  evSales: number;
  pb: number;
  dividendYield: number;
  // 9y CAGRs (FY17 → FY26)
  revenueCagr9y: number | null;
  ebitdaCagr9y: number | null;
  patCagr9y: number | null;
}

export interface ScreenerFilter {
  sectors?: string[];
  industries?: string[];
  marketCapMinCr?: number;
  marketCapMaxCr?: number;
  // %
  roceMinPct?: number;
  roeMinPct?: number;
  revenueCagrMinPct?: number;
  patCagrMinPct?: number;
  ebitdaMarginMinPct?: number;
  divYieldMinPct?: number;
  // Multiples
  debtEquityMax?: number;
  peMin?: number;
  peMax?: number;
  evEbitdaMax?: number;
  evSalesMax?: number;
  pbMax?: number;
  search?: string;
}

export type ScreenerSortKey =
  | "marketCapCr"
  | "revenueCr"
  | "patCr"
  | "revenueCagr9y"
  | "patCagr9y"
  | "ebitdaMargin"
  | "patMargin"
  | "roce"
  | "roe"
  | "debtToEquity"
  | "pe"
  | "evEbitda"
  | "evSales"
  | "pb"
  | "divYield";

// ---- Snapshot builder ---------------------------------------------------

async function snapshotFor(ticker: string): Promise<ScreenerRow | null> {
  const md = marketData();
  const [profile, quote, annual] = await Promise.all([
    md.getProfile(ticker),
    md.getQuote(ticker),
    md.getAnnualFinancials(ticker, 10),
  ]);
  if (!profile || annual.length === 0) return null;
  const latest = annual[0];
  const oldest = annual[annual.length - 1];
  const years = (latest.fiscalYear ?? 0) - (oldest.fiscalYear ?? 0);
  return {
    ticker: profile.ticker,
    name: profile.name,
    sector: profile.sector ?? "—",
    industry: profile.industry ?? "—",
    marketCapCr: profile.marketCapCr ?? 0,
    price: quote?.price ?? 0,
    revenueCr: latest.revenueCr ?? 0,
    ebitdaCr: latest.ebitdaCr ?? 0,
    patCr: latest.patCr ?? 0,
    fcfCr: latest.fcfCr ?? null,
    ebitdaMargin: latest.ebitdaMargin ?? 0,
    patMargin: latest.patMargin ?? 0,
    roce: latest.roce ?? 0,
    roe: latest.roe ?? 0,
    debtToEquity: latest.debtToEquity ?? 0,
    netDebtCr: latest.netDebtCr ?? 0,
    pe: latest.pe ?? 0,
    evEbitda: latest.evEbitda ?? 0,
    evSales: latest.evSales ?? 0,
    pb: latest.pb ?? 0,
    dividendYield: latest.dividendYield ?? 0,
    revenueCagr9y: cagr(oldest.revenueCr ?? 0, latest.revenueCr ?? 0, years),
    ebitdaCagr9y: cagr(oldest.ebitdaCr ?? 0, latest.ebitdaCr ?? 0, years),
    patCagr9y: cagr(oldest.patCr ?? 0, latest.patCr ?? 0, years),
  };
}

let _snapshotCache: { ts: number; rows: ScreenerRow[] } | null = null;
const SNAPSHOT_TTL_MS = 60_000;

export async function getUniverseSnapshot(): Promise<ScreenerRow[]> {
  if (_snapshotCache && Date.now() - _snapshotCache.ts < SNAPSHOT_TTL_MS) {
    return _snapshotCache.rows;
  }
  // The data provider doesn't expose enumerate-all today; fall back to the
  // seed universe of tickers. Real-provider integration would replace this
  // with a `listCompanies({ sector, exchange })` call.
  const tickers = MOCK_UNIVERSE.map((r) => r.ticker);
  const rows = (await Promise.all(tickers.map((t) => snapshotFor(t)))).filter(
    (r): r is ScreenerRow => r !== null,
  );
  _snapshotCache = { ts: Date.now(), rows };
  return rows;
}

// ---- Filter / sort ------------------------------------------------------

export function applyFilter(rows: ScreenerRow[], f: ScreenerFilter): ScreenerRow[] {
  let out = rows;
  if (f.sectors?.length) {
    const set = new Set(f.sectors.map((s) => s.toLowerCase()));
    out = out.filter((r) => set.has(r.sector.toLowerCase()));
  }
  if (f.industries?.length) {
    const set = new Set(f.industries.map((s) => s.toLowerCase()));
    out = out.filter((r) => set.has(r.industry.toLowerCase()));
  }
  if (f.search) {
    const q = f.search.toLowerCase();
    out = out.filter((r) => r.ticker.toLowerCase().includes(q) || r.name.toLowerCase().includes(q));
  }
  if (typeof f.marketCapMinCr === "number") out = out.filter((r) => r.marketCapCr >= f.marketCapMinCr!);
  if (typeof f.marketCapMaxCr === "number") out = out.filter((r) => r.marketCapCr <= f.marketCapMaxCr!);
  if (typeof f.roceMinPct === "number") out = out.filter((r) => r.roce * 100 >= f.roceMinPct!);
  if (typeof f.roeMinPct === "number") out = out.filter((r) => r.roe * 100 >= f.roeMinPct!);
  if (typeof f.revenueCagrMinPct === "number")
    out = out.filter((r) => (r.revenueCagr9y ?? 0) * 100 >= f.revenueCagrMinPct!);
  if (typeof f.patCagrMinPct === "number")
    out = out.filter((r) => (r.patCagr9y ?? 0) * 100 >= f.patCagrMinPct!);
  if (typeof f.ebitdaMarginMinPct === "number")
    out = out.filter((r) => r.ebitdaMargin * 100 >= f.ebitdaMarginMinPct!);
  if (typeof f.divYieldMinPct === "number")
    out = out.filter((r) => r.dividendYield * 100 >= f.divYieldMinPct!);
  if (typeof f.debtEquityMax === "number") out = out.filter((r) => r.debtToEquity <= f.debtEquityMax!);
  if (typeof f.peMin === "number") out = out.filter((r) => r.pe >= f.peMin!);
  if (typeof f.peMax === "number") out = out.filter((r) => r.pe <= f.peMax!);
  if (typeof f.evEbitdaMax === "number") out = out.filter((r) => r.evEbitda <= f.evEbitdaMax!);
  if (typeof f.evSalesMax === "number") out = out.filter((r) => r.evSales <= f.evSalesMax!);
  if (typeof f.pbMax === "number") out = out.filter((r) => r.pb <= f.pbMax!);
  return out;
}

export function applySort(rows: ScreenerRow[], key: ScreenerSortKey, dir: "asc" | "desc"): ScreenerRow[] {
  const mult = dir === "asc" ? 1 : -1;
  const get = (r: ScreenerRow): number => {
    switch (key) {
      case "marketCapCr": return r.marketCapCr;
      case "revenueCr": return r.revenueCr;
      case "patCr": return r.patCr;
      case "revenueCagr9y": return r.revenueCagr9y ?? -Infinity;
      case "patCagr9y": return r.patCagr9y ?? -Infinity;
      case "ebitdaMargin": return r.ebitdaMargin;
      case "patMargin": return r.patMargin;
      case "roce": return r.roce;
      case "roe": return r.roe;
      case "debtToEquity": return r.debtToEquity;
      case "pe": return r.pe;
      case "evEbitda": return r.evEbitda;
      case "evSales": return r.evSales;
      case "pb": return r.pb;
      case "divYield": return r.dividendYield;
    }
  };
  return [...rows].sort((a, b) => (get(a) - get(b)) * mult);
}

// ---- Presets ------------------------------------------------------------

export interface ScreenerPreset {
  id: string;
  name: string;
  description: string;
  filter: ScreenerFilter;
  sort: { key: ScreenerSortKey; dir: "asc" | "desc" };
}

export const BUILTIN_PRESETS: ScreenerPreset[] = [
  {
    id: "quality-compounders",
    name: "Quality Compounders",
    description: "High ROCE, low leverage, sustained growth.",
    filter: { roceMinPct: 20, debtEquityMax: 0.5, revenueCagrMinPct: 12 },
    sort: { key: "roce", dir: "desc" },
  },
  {
    id: "growth-at-reasonable-price",
    name: "Growth at Reasonable Price",
    description: "Above-trend growth still trading at sub-30x earnings.",
    filter: { revenueCagrMinPct: 15, patCagrMinPct: 15, peMax: 30, roeMinPct: 15 },
    sort: { key: "patCagr9y", dir: "desc" },
  },
  {
    id: "deep-value",
    name: "Deep Value",
    description: "Cheap on multiples + meaningful dividend.",
    filter: { peMax: 20, evEbitdaMax: 12, divYieldMinPct: 1, debtEquityMax: 1 },
    sort: { key: "pe", dir: "asc" },
  },
  {
    id: "cash-compounders",
    name: "Cash Compounders",
    description: "Net-cash balance sheet, fat margins, healthy returns.",
    filter: { ebitdaMarginMinPct: 22, roceMinPct: 15, debtEquityMax: 0.2 },
    sort: { key: "ebitdaMargin", dir: "desc" },
  },
  {
    id: "midcap-growth",
    name: "Mid-cap Growth",
    description: "Mid-cap names ramping growth.",
    filter: { marketCapMinCr: 10_000, marketCapMaxCr: 1_50_000, revenueCagrMinPct: 18 },
    sort: { key: "revenueCagr9y", dir: "desc" },
  },
];
