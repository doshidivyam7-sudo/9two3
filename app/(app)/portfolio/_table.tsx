"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fmtINR, fmtNum, fmtPctValue } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Holding {
  id: string;
  ticker: string;
  name: string;
  quantity: number;
  avgCost: number;
  ltp: number;
  value: number;
  cost: number;
  unrealizedPnL: number;
  unrealizedPct: number;
  notes?: string | null;
}

export function PortfolioTable() {
  const [data, setData] = useState<{ holdings: Holding[] } | null>(null);
  useEffect(() => {
    let live = true;
    const load = () => fetch("/api/portfolio").then((r) => r.json()).then((d) => { if (live) setData(d); });
    load();
    const id = setInterval(load, 30_000);
    return () => { live = false; clearInterval(id); };
  }, []);

  if (!data) {
    return <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>;
  }
  const holdings = data.holdings ?? [];
  if (holdings.length === 0) {
    return <div className="p-8 text-center text-sm text-muted-foreground">No holdings yet. Add your first to track live P&L.</div>;
  }
  const totals = holdings.reduce(
    (acc, h) => {
      acc.value += h.value;
      acc.cost += h.cost;
      return acc;
    },
    { value: 0, cost: 0 },
  );
  const totalPnL = totals.value - totals.cost;
  const totalPct = totals.cost ? totalPnL / totals.cost : 0;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-y border-border text-[10px] uppercase tracking-widest text-muted-foreground">
            <th className="px-4 py-2 text-left font-medium">Ticker</th>
            <th className="px-4 py-2 text-left font-medium">Name</th>
            <th className="px-4 py-2 text-right font-medium">Qty</th>
            <th className="px-4 py-2 text-right font-medium">Avg cost</th>
            <th className="px-4 py-2 text-right font-medium">LTP</th>
            <th className="px-4 py-2 text-right font-medium">Value</th>
            <th className="px-4 py-2 text-right font-medium">P&L</th>
            <th className="px-4 py-2 text-right font-medium">%</th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((h) => (
            <tr key={h.id} className="border-b border-border/60 last:border-b-0 hover:bg-accent/30">
              <td className="px-4 py-2 font-mono text-xs font-semibold">
                <Link href={`/research/${h.ticker}`} className="hover:underline">{h.ticker}</Link>
              </td>
              <td className="px-4 py-2 text-muted-foreground">{h.name}</td>
              <td className="px-4 py-2 text-right num">{fmtNum(h.quantity)}</td>
              <td className="px-4 py-2 text-right num">{fmtINR(h.avgCost)}</td>
              <td className="px-4 py-2 text-right num">{fmtINR(h.ltp)}</td>
              <td className="px-4 py-2 text-right num">{fmtINR(h.value)}</td>
              <td className={cn("px-4 py-2 text-right num", h.unrealizedPnL >= 0 ? "stat-bull" : "stat-bear")}>{fmtINR(h.unrealizedPnL)}</td>
              <td className={cn("px-4 py-2 text-right num", h.unrealizedPct >= 0 ? "stat-bull" : "stat-bear")}>{fmtPctValue(h.unrealizedPct * 100)}</td>
            </tr>
          ))}
          <tr className="border-t-2 border-border bg-background/40 font-semibold">
            <td className="px-4 py-2" colSpan={5}>Total</td>
            <td className="px-4 py-2 text-right num">{fmtINR(totals.value)}</td>
            <td className={cn("px-4 py-2 text-right num", totalPnL >= 0 ? "stat-bull" : "stat-bear")}>{fmtINR(totalPnL)}</td>
            <td className={cn("px-4 py-2 text-right num", totalPnL >= 0 ? "stat-bull" : "stat-bear")}>{fmtPctValue(totalPct * 100)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
