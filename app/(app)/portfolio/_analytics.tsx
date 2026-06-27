"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, AlertTriangle, TrendingUp, TrendingDown, PieChart as PieIcon, Layers, Gauge } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SegmentPie } from "@/components/charts/segment-pie";
import { fmtINR, fmtNum, fmtPctValue } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Holding {
  id: string; ticker: string; name: string; sector: string;
  value: number; weight: number; unrealizedPct: number;
  pe: number | null; roce: number | null; revenueCagr: number | null; debtToEquity: number | null;
}

interface Analytics {
  summary: { totalValue: number; totalCost: number; totalPnL: number; totalPct: number; holdingCount: number };
  holdings: Holding[];
  sectorAllocation: { sector: string; value: number; weight: number }[];
  concentration: { top1: number; top3: number; top5: number; hhi: number; effectiveStocks: number };
  weighted: { pe: number | null; roce: number | null; revenueCagr: number | null; debtToEquity: number | null };
  best: Holding[];
  worst: Holding[];
  flags: { level: "HIGH" | "MEDIUM" | "LOW"; message: string }[];
}

export function PortfolioAnalytics() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    fetch("/api/portfolio/analytics")
      .then((r) => r.json())
      .then((d) => { if (live) setData(d); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, []);

  if (loading) {
    return <Card><CardContent className="flex items-center justify-center p-10 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin mr-2" /> Computing analytics…
    </CardContent></Card>;
  }
  if (!data || data.summary.holdingCount === 0) {
    return <Card><CardContent className="p-10 text-center text-sm text-muted-foreground">
      Add holdings to see allocation, concentration, and weighted quality.
    </CardContent></Card>;
  }

  const { summary, sectorAllocation, concentration, weighted, best, worst, flags } = data;

  return (
    <div className="space-y-6">
      {/* Summary tiles */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile label="Market value" value={fmtINR(summary.totalValue)} />
        <Tile label="Invested" value={fmtINR(summary.totalCost)} />
        <Tile label="Unrealized P&L" value={fmtINR(summary.totalPnL)} tone={summary.totalPnL >= 0 ? "bull" : "bear"} />
        <Tile label="Return" value={fmtPctValue(summary.totalPct * 100)} tone={summary.totalPct >= 0 ? "bull" : "bear"} />
      </div>

      {/* Risk flags */}
      {flags.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-3.5 w-3.5" /> Risk flags</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {flags.map((f, i) => (
              <div key={i} className="flex items-center gap-2 rounded-md border border-border bg-background/40 p-2.5 text-sm">
                <Badge variant={f.level === "HIGH" ? "bear" : f.level === "MEDIUM" ? "warn" : "outline"}>{f.level}</Badge>
                <span>{f.message}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sector allocation */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><PieIcon className="h-3.5 w-3.5" /> Sector allocation</CardTitle></CardHeader>
          <CardContent>
            <SegmentPie data={sectorAllocation.map((s) => ({ name: s.sector, value: s.value }))} height={180} />
            <ul className="mt-3 space-y-1.5">
              {sectorAllocation.map((s) => (
                <li key={s.sector} className="flex items-baseline justify-between text-xs">
                  <span className="truncate">{s.sector}</span>
                  <span className="ml-2 font-mono tabular-nums">{fmtPctValue(s.weight * 100)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Concentration */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Layers className="h-3.5 w-3.5" /> Concentration</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Stat label="Largest position" value={fmtPctValue(concentration.top1 * 100)} warn={concentration.top1 > 0.3} />
            <Stat label="Top 3 holdings" value={fmtPctValue(concentration.top3 * 100)} warn={concentration.top3 > 0.7} />
            <Stat label="Top 5 holdings" value={fmtPctValue(concentration.top5 * 100)} />
            <Stat label="Effective # of stocks" value={fmtNum(concentration.effectiveStocks, 1)} hint={`of ${summary.holdingCount} held`} />
            <Stat label="HHI" value={fmtNum(concentration.hhi, 3)} hint="0 = diversified, 1 = single name" />
          </CardContent>
        </Card>

        {/* Weighted quality */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Gauge className="h-3.5 w-3.5" /> Weighted quality</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Stat label="Weighted P/E" value={weighted.pe !== null ? `${fmtNum(weighted.pe, 1)}x` : "—"} />
            <Stat label="Weighted ROCE" value={weighted.roce !== null ? fmtPctValue(weighted.roce * 100) : "—"} tone={(weighted.roce ?? 0) >= 0.2 ? "bull" : undefined} />
            <Stat label="Weighted rev CAGR" value={weighted.revenueCagr !== null ? fmtPctValue(weighted.revenueCagr * 100) : "—"} tone={(weighted.revenueCagr ?? 0) >= 0.15 ? "bull" : undefined} />
            <Stat label="Weighted D/E" value={weighted.debtToEquity !== null ? fmtNum(weighted.debtToEquity, 2) : "—"} warn={(weighted.debtToEquity ?? 0) > 1} />
            <p className="pt-1 text-[10px] text-muted-foreground">Value-weighted across the book — the quality profile of every rupee invested.</p>
          </CardContent>
        </Card>
      </div>

      {/* Best / worst */}
      <div className="grid gap-6 lg:grid-cols-2">
        <MoversCard title="Top performers" icon={TrendingUp} rows={best} tone="bull" />
        <MoversCard title="Laggards" icon={TrendingDown} rows={worst} tone="bear" />
      </div>

      {/* Position weights */}
      <Card>
        <CardHeader><CardTitle>Position weights</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {[...data.holdings].sort((a, b) => b.weight - a.weight).map((h) => (
            <div key={h.id}>
              <div className="flex items-baseline justify-between text-xs">
                <Link href={`/research/${h.ticker}`} className="font-mono font-semibold hover:underline">{h.ticker}</Link>
                <span className="font-mono tabular-nums">{fmtPctValue(h.weight * 100)} · {fmtINR(h.value)}</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${h.weight * 100}%` }} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function Tile({ label, value, tone }: { label: string; value: string; tone?: "bull" | "bear" }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={cn("mt-1 font-mono text-lg font-semibold tabular-nums", tone === "bull" && "stat-bull", tone === "bear" && "stat-bear")}>{value}</div>
    </div>
  );
}

function Stat({ label, value, hint, tone, warn }: { label: string; value: string; hint?: string; tone?: "bull"; warn?: boolean }) {
  return (
    <div className="flex items-baseline justify-between border-b border-border/40 pb-2 last:border-b-0 last:pb-0">
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        {hint && <div className="text-[10px] text-muted-foreground/70">{hint}</div>}
      </div>
      <span className={cn("font-mono text-sm tabular-nums", tone === "bull" && "stat-bull", warn && "stat-bear")}>{value}</span>
    </div>
  );
}

function MoversCard({ title, icon: Icon, rows, tone }: { title: string; icon: any; rows: Holding[]; tone: "bull" | "bear" }) {
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><Icon className="h-3.5 w-3.5" /> {title}</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {rows.map((h) => (
          <div key={h.id} className="flex items-center justify-between rounded-md border border-border bg-background/40 p-2.5">
            <div>
              <Link href={`/research/${h.ticker}`} className="font-mono text-xs font-semibold hover:underline">{h.ticker}</Link>
              <div className="text-[10px] text-muted-foreground truncate max-w-[180px]">{h.name}</div>
            </div>
            <span className={cn("font-mono text-sm tabular-nums", h.unrealizedPct >= 0 ? "stat-bull" : "stat-bear")}>
              {fmtPctValue(h.unrealizedPct * 100)}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
