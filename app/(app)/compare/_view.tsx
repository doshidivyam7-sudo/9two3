"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, X, Loader2, Trophy, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OverlayLineChart } from "@/components/charts/overlay-line-chart";
import { fmtCr, fmtINR, fmtNum, fmtPctValue, cagr } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Company {
  ticker: string;
  profile: { name: string; sector?: string; industry?: string; marketCapCr?: number };
  quote?: { price: number; changePct: number };
  annual: any[];
  concall: any | null;
}

const PALETTE = [
  "hsl(217, 91%, 60%)",
  "hsl(158, 64%, 50%)",
  "hsl(38, 92%, 60%)",
  "hsl(280, 73%, 60%)",
  "hsl(0, 84%, 60%)",
];

export function CompareView({ initial }: { initial: string[] }) {
  const [tickers, setTickers] = useState<string[]>(initial.length >= 2 ? initial : ["RELIANCE", "TCS"]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState("");

  useEffect(() => {
    let live = true;
    setLoading(true);
    fetch(`/api/compare?tickers=${tickers.join(",")}`)
      .then((r) => r.json())
      .then((d) => { if (live) setCompanies(d.companies ?? []); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [tickers]);

  function addTicker() {
    const t = adding.trim().toUpperCase();
    if (!t || tickers.includes(t) || tickers.length >= 5) return;
    setTickers([...tickers, t]);
    setAdding("");
  }
  function removeTicker(t: string) {
    if (tickers.length <= 2) return;
    setTickers(tickers.filter((x) => x !== t));
  }

  const colorFor = useMemo(() => {
    const map = new Map<string, string>();
    tickers.forEach((t, i) => map.set(t, PALETTE[i % PALETTE.length]));
    return map;
  }, [tickers]);

  // Build the overlay chart series — for each ticker, ascending-FY revenue points.
  const overlayData = useMemo(() => {
    if (companies.length === 0) return [];
    const allYears = new Set<number>();
    companies.forEach((c) => c.annual.forEach((a) => allYears.add(a.fiscalYear)));
    const years = [...allYears].sort();
    return years.map((fy) => {
      const row: Record<string, any> = { fiscalYear: fy };
      companies.forEach((c) => {
        const a = c.annual.find((x: any) => x.fiscalYear === fy);
        row[`rev_${c.ticker}`] = a?.revenueCr ?? null;
        row[`ebitda_${c.ticker}`] = a?.ebitdaCr ?? null;
        row[`pat_${c.ticker}`] = a?.patCr ?? null;
        row[`roce_${c.ticker}`] = a?.roce ? a.roce * 100 : null;
      });
      return row;
    });
  }, [companies]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tickers ({tickers.length}/5)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2">
            {tickers.map((t) => (
              <div
                key={t}
                className="flex items-center gap-1 rounded-md border border-border bg-background/40 px-2 py-1 text-xs font-mono"
                style={{ borderColor: `${colorFor.get(t)}55` }}
              >
                <span className="inline-block h-2 w-2 rounded-full" style={{ background: colorFor.get(t) }} />
                {t}
                {tickers.length > 2 && (
                  <button onClick={() => removeTicker(t)} className="text-muted-foreground hover:text-foreground ml-1">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
            {tickers.length < 5 && (
              <div className="flex items-center gap-1">
                <Input
                  className="h-7 w-32 text-xs"
                  placeholder="Add ticker…"
                  value={adding}
                  onChange={(e) => setAdding(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && addTicker()}
                />
                <Button size="sm" variant="outline" onClick={addTicker} disabled={!adding}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            )}
            <Link
              href={`/compare?tickers=${tickers.join(",")}`}
              className="ml-auto text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
            >
              Shareable URL ↗
            </Link>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card><CardContent className="flex items-center justify-center p-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading comparison…
        </CardContent></Card>
      ) : companies.length < 2 ? (
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">
          Need at least 2 valid tickers. Try RELIANCE, TCS, INFY, HDFCBANK, BAJFINANCE, HUDCO, INOXINDIA.
        </CardContent></Card>
      ) : (
        <>
          <HeaderCards companies={companies} colorFor={colorFor} />
          <MetricMatrix companies={companies} />
          <Card>
            <CardHeader><CardTitle>Revenue trend (₹ Cr)</CardTitle></CardHeader>
            <CardContent>
              <OverlayLineChart
                data={overlayData}
                series={companies.map((c) => ({ key: `rev_${c.ticker}`, label: c.ticker, color: colorFor.get(c.ticker) ?? "hsl(217, 91%, 60%)" }))}
                height={300}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>ROCE trend</CardTitle></CardHeader>
            <CardContent>
              <OverlayLineChart
                data={overlayData.map((row) => {
                  // ROCE values were already multiplied by 100 — convert back to ratio for fmtPct
                  const out: Record<string, any> = { fiscalYear: row.fiscalYear };
                  companies.forEach((c) => {
                    const v = row[`roce_${c.ticker}`];
                    out[`roce_${c.ticker}`] = typeof v === "number" ? v / 100 : null;
                  });
                  return out;
                })}
                series={companies.map((c) => ({ key: `roce_${c.ticker}`, label: c.ticker, color: colorFor.get(c.ticker) ?? "hsl(217, 91%, 60%)" }))}
                height={260}
                formatY="percent"
              />
            </CardContent>
          </Card>
          <ConcallStrip companies={companies} />
        </>
      )}
    </div>
  );
}

function HeaderCards({ companies, colorFor }: { companies: Company[]; colorFor: Map<string, string> }) {
  return (
    <div className={cn("grid gap-3", `grid-cols-${Math.min(companies.length, 5)}`)} style={{
      gridTemplateColumns: `repeat(${companies.length}, minmax(0, 1fr))`,
    }}>
      {companies.map((c) => {
        const last = c.annual[0];
        const px = c.quote?.price;
        const up = (c.quote?.changePct ?? 0) >= 0;
        return (
          <Card key={c.ticker} style={{ borderTopColor: colorFor.get(c.ticker), borderTopWidth: 2 }}>
            <CardContent className="p-4">
              <div className="flex items-baseline justify-between">
                <Link href={`/research/${c.ticker}`} className="font-mono text-sm font-semibold hover:underline">{c.ticker}</Link>
                <Badge variant="outline" className="text-[9px]">{c.profile.sector}</Badge>
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{c.profile.name}</div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-mono text-xl font-semibold tabular-nums">{px ? fmtINR(px) : "—"}</span>
                {c.quote && (
                  <span className={cn("text-xs", up ? "stat-bull" : "stat-bear")}>
                    {fmtPctValue(c.quote.changePct * 100)}
                  </span>
                )}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-y-1 text-xs">
                <span className="text-muted-foreground">Mkt cap</span>
                <span className="text-right num">{c.profile.marketCapCr ? fmtCr(c.profile.marketCapCr, "") : "—"}</span>
                <span className="text-muted-foreground">PE</span>
                <span className="text-right num">{last?.pe ? `${fmtNum(last.pe, 1)}x` : "—"}</span>
                <span className="text-muted-foreground">EV/EBITDA</span>
                <span className="text-right num">{last?.evEbitda ? `${fmtNum(last.evEbitda, 1)}x` : "—"}</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// Define a metric row + the "winner" rule (which company is best on this metric).
interface MetricDef {
  label: string;
  group: "Scale" | "Growth" | "Profitability" | "Balance Sheet" | "Valuation";
  get: (c: Company) => number | null;
  format: (v: number | null) => string;
  // Direction in which "better" goes.
  better: "higher" | "lower";
  // Optional tinting threshold.
  tint?: (v: number) => "bull" | "bear" | null;
}

const METRICS: MetricDef[] = [
  { label: "Market cap (Cr)", group: "Scale", get: (c) => c.profile.marketCapCr ?? null, format: (v) => v !== null ? fmtCr(v, "") : "—", better: "higher" },
  { label: "FY26 revenue", group: "Scale", get: (c) => c.annual[0]?.revenueCr ?? null, format: (v) => v !== null ? fmtCr(v, "") : "—", better: "higher" },
  { label: "FY26 EBITDA", group: "Scale", get: (c) => c.annual[0]?.ebitdaCr ?? null, format: (v) => v !== null ? fmtCr(v, "") : "—", better: "higher" },
  { label: "FY26 PAT", group: "Scale", get: (c) => c.annual[0]?.patCr ?? null, format: (v) => v !== null ? fmtCr(v, "") : "—", better: "higher" },

  { label: "Revenue CAGR (9y)", group: "Growth", get: cagrFor("revenueCr"), format: pct, better: "higher", tint: (v) => v >= 0.15 ? "bull" : null },
  { label: "EBITDA CAGR (9y)", group: "Growth", get: cagrFor("ebitdaCr"), format: pct, better: "higher", tint: (v) => v >= 0.15 ? "bull" : null },
  { label: "PAT CAGR (9y)", group: "Growth", get: cagrFor("patCr"), format: pct, better: "higher", tint: (v) => v >= 0.15 ? "bull" : null },

  { label: "EBITDA margin", group: "Profitability", get: (c) => c.annual[0]?.ebitdaMargin ?? null, format: pct, better: "higher" },
  { label: "PAT margin", group: "Profitability", get: (c) => c.annual[0]?.patMargin ?? null, format: pct, better: "higher" },
  { label: "ROCE", group: "Profitability", get: (c) => c.annual[0]?.roce ?? null, format: pct, better: "higher", tint: (v) => v >= 0.20 ? "bull" : null },
  { label: "ROE", group: "Profitability", get: (c) => c.annual[0]?.roe ?? null, format: pct, better: "higher", tint: (v) => v >= 0.18 ? "bull" : null },

  { label: "Net debt (Cr)", group: "Balance Sheet", get: (c) => c.annual[0]?.netDebtCr ?? null, format: (v) => v !== null ? `₹${Math.round(v).toLocaleString("en-IN")}` : "—", better: "lower" },
  { label: "Debt / Equity", group: "Balance Sheet", get: (c) => c.annual[0]?.debtToEquity ?? null, format: (v) => v !== null ? fmtNum(v, 2) : "—", better: "lower", tint: (v) => v > 1 ? "bear" : null },
  { label: "Free cash flow (Cr)", group: "Balance Sheet", get: (c) => c.annual[0]?.fcfCr ?? null, format: (v) => v !== null ? `₹${Math.round(v).toLocaleString("en-IN")}` : "—", better: "higher" },

  { label: "PE (FY26)", group: "Valuation", get: (c) => c.annual[0]?.pe ?? null, format: (v) => v !== null ? `${fmtNum(v, 1)}x` : "—", better: "lower" },
  { label: "EV/EBITDA", group: "Valuation", get: (c) => c.annual[0]?.evEbitda ?? null, format: (v) => v !== null ? `${fmtNum(v, 1)}x` : "—", better: "lower" },
  { label: "EV/Sales", group: "Valuation", get: (c) => c.annual[0]?.evSales ?? null, format: (v) => v !== null ? `${fmtNum(v, 1)}x` : "—", better: "lower" },
  { label: "P/B", group: "Valuation", get: (c) => c.annual[0]?.pb ?? null, format: (v) => v !== null ? `${fmtNum(v, 1)}x` : "—", better: "lower" },
  { label: "Dividend yield", group: "Valuation", get: (c) => c.annual[0]?.dividendYield ?? null, format: pct, better: "higher" },
];

function cagrFor(key: "revenueCr" | "ebitdaCr" | "patCr") {
  return (c: Company) => {
    const sorted = [...c.annual].sort((a, b) => a.fiscalYear - b.fiscalYear);
    if (sorted.length < 2) return null;
    const first = sorted[0][key];
    const last = sorted[sorted.length - 1][key];
    const years = sorted[sorted.length - 1].fiscalYear - sorted[0].fiscalYear;
    return cagr(first, last, years);
  };
}

function pct(v: number | null) {
  if (v === null || !Number.isFinite(v)) return "—";
  return fmtPctValue(v * 100);
}

function MetricMatrix({ companies }: { companies: Company[] }) {
  const groups = ["Scale", "Growth", "Profitability", "Balance Sheet", "Valuation"] as const;
  return (
    <Card>
      <CardHeader><CardTitle>Fundamentals — side by side</CardTitle></CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-y border-border text-[10px] uppercase tracking-widest text-muted-foreground">
              <th className="px-4 py-2 text-left font-medium sticky left-0 bg-card w-56">Metric</th>
              {companies.map((c) => (
                <th key={c.ticker} className="px-4 py-2 text-right font-medium">
                  <Link href={`/research/${c.ticker}`} className="font-mono hover:underline">{c.ticker}</Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.flatMap((g) => {
              const rows = METRICS.filter((m) => m.group === g);
              return [
                <tr key={`g-${g}`} className="border-b border-border bg-background/40">
                  <td colSpan={companies.length + 1} className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{g}</td>
                </tr>,
                ...rows.map((m) => {
                  const values = companies.map((c) => m.get(c));
                  const numeric = values.filter((v): v is number => v !== null && Number.isFinite(v));
                  const winner = numeric.length > 0
                    ? (m.better === "higher" ? Math.max(...numeric) : Math.min(...numeric))
                    : null;
                  return (
                    <tr key={m.label} className="border-b border-border/60 last:border-b-0">
                      <td className="px-4 py-2 sticky left-0 bg-card text-muted-foreground">{m.label}</td>
                      {companies.map((c, i) => {
                        const v = values[i];
                        const isWinner = v !== null && v === winner && numeric.length > 1 && new Set(numeric).size > 1;
                        const tint = v !== null && m.tint ? m.tint(v) : null;
                        return (
                          <td
                            key={c.ticker}
                            className={cn(
                              "px-4 py-2 text-right num",
                              isWinner && "font-semibold text-foreground",
                              tint === "bull" && "stat-bull",
                              tint === "bear" && "stat-bear",
                            )}
                          >
                            <span className="inline-flex items-center justify-end gap-1">
                              {isWinner && <Trophy className="h-3 w-3 text-[hsl(var(--warn))]" />}
                              {m.format(v)}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  );
                }),
              ];
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function ConcallStrip({ companies }: { companies: Company[] }) {
  const withConcall = companies.filter((c) => c.concall);
  if (withConcall.length === 0) return null;
  return (
    <Card>
      <CardHeader><CardTitle>Latest concall guidance ({withConcall[0].concall.period})</CardTitle></CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-y border-border text-[10px] uppercase tracking-widest text-muted-foreground">
              <th className="px-4 py-2 text-left font-medium">Dimension</th>
              {withConcall.map((c) => <th key={c.ticker} className="px-4 py-2 text-left font-medium font-mono">{c.ticker}</th>)}
            </tr>
          </thead>
          <tbody>
            {(["revenueGuidance", "ebitdaMarginGuidance", "capexGuidance"] as const).map((key) => (
              <tr key={key} className="border-b border-border/60 last:border-b-0 align-top">
                <td className="px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {key.replace("Guidance", "").replace(/([A-Z])/g, " $1").trim()}
                </td>
                {withConcall.map((c) => {
                  const g = c.concall[key];
                  return (
                    <td key={c.ticker} className="px-4 py-2.5 text-xs">
                      <div className="font-medium">{g.value}</div>
                      <div className="text-[10px] text-muted-foreground">{g.horizon} · {g.confidence}</div>
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr className="border-b border-border/60 last:border-b-0 align-top">
              <td className="px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Tone</td>
              {withConcall.map((c) => (
                <td key={c.ticker} className="px-4 py-2.5">
                  <Badge variant={c.concall.tone === "POSITIVE" ? "bull" : c.concall.tone === "NEGATIVE" ? "bear" : "warn"}>
                    {c.concall.tone}
                  </Badge>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
