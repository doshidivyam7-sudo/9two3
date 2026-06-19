"use client";

import { useEffect, useMemo, useState } from "react";
import { Calculator, Loader2 } from "lucide-react";
import type { FinancialPoint, PeerSnapshot, PriceQuote } from "@/lib/data/types";
import { defaultAssumptionsFromFundamentals, type DCFAssumptions, type DCFResult } from "@/lib/valuation/dcf";
import { summarizeRelative } from "@/lib/valuation/relative";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { fmtCr, fmtINR, fmtNum, fmtPctValue } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Props {
  ticker: string;
  annual: FinancialPoint[];
  peers: PeerSnapshot[];
  quote?: PriceQuote;
}

export function ValuationSection({ ticker, annual, peers, quote }: Props) {
  const last = annual[0];
  const seed = useMemo(
    () =>
      defaultAssumptionsFromFundamentals({
        baseRevenueCr: last?.revenueCr ?? 1000,
        ebitdaMargin: typeof last?.ebitdaMargin === "number" ? last.ebitdaMargin : 0.18,
        netDebtCr: last?.netDebtCr ?? 0,
        sharesOutstandingCr: last?.sharesOutstandingCr ?? 10,
        growthGuess: 0.12,
      }),
    [last],
  );

  const [a, setA] = useState<DCFAssumptions>(seed);
  const [result, setResult] = useState<DCFResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);

  // Run DCF whenever assumptions change
  useEffect(() => {
    const id = setTimeout(async () => {
      const res = await fetch(`/api/valuation/dcf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assumptions: a }),
      });
      if (res.ok) setResult(await res.json());
    }, 200);
    return () => clearTimeout(id);
  }, [a]);

  async function suggest() {
    setLoading(true);
    try {
      const res = await fetch(`/api/valuation/suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker }),
      });
      if (res.ok) {
        const data = await res.json();
        setA(data.assumptions);
        setSuggestion(data.rationale);
      }
    } finally {
      setLoading(false);
    }
  }

  const px = quote?.price;
  const upside = px && result ? result.intrinsicValuePerShare / px - 1 : null;
  const relativeRows = useMemo(
    () =>
      summarizeRelative(
        {
          pe: last?.pe,
          evEbitda: last?.evEbitda,
          evSales: last?.evSales,
          pb: last?.pb,
        },
        peers,
      ),
    [last, peers],
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-3.5 w-3.5" /> DCF Assumptions
            </CardTitle>
            <Button size="sm" variant="outline" onClick={suggest} disabled={loading}>
              {loading && <Loader2 className="h-3 w-3 animate-spin" />} AI suggest
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {suggestion && (
              <div className="rounded-md border border-border bg-background/40 p-3 text-xs text-muted-foreground">
                {suggestion}
              </div>
            )}
            <PctSlider
              label="Year 1 revenue growth"
              value={a.revenueGrowth[0]}
              onChange={(v) => setA((p) => ({ ...p, revenueGrowth: rampGrowth(v, p.revenueGrowth.length) }))}
              min={-0.05} max={0.5} step={0.005}
            />
            <PctSlider
              label="EBITDA margin"
              value={typeof a.ebitdaMargin === "number" ? a.ebitdaMargin : a.ebitdaMargin[0]}
              onChange={(v) => setA((p) => ({ ...p, ebitdaMargin: v }))}
              min={0} max={0.6} step={0.005}
            />
            <PctSlider
              label="Tax rate"
              value={a.taxRate}
              onChange={(v) => setA((p) => ({ ...p, taxRate: v }))}
              min={0.1} max={0.4} step={0.005}
            />
            <PctSlider
              label="WACC"
              value={a.wacc}
              onChange={(v) => setA((p) => ({ ...p, wacc: v }))}
              min={0.06} max={0.2} step={0.0025}
            />
            <PctSlider
              label="Terminal growth"
              value={a.terminalGrowth}
              onChange={(v) => setA((p) => ({ ...p, terminalGrowth: Math.min(v, p.wacc - 0.01) }))}
              min={0} max={0.07} step={0.0025}
            />
            <PctSlider
              label="Capex % of revenue"
              value={a.capexPctOfRevenue}
              onChange={(v) => setA((p) => ({ ...p, capexPctOfRevenue: v }))}
              min={0} max={0.2} step={0.005}
            />
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <Label>Net debt (Cr)</Label>
                <Input
                  className="mt-1.5"
                  type="number"
                  value={Math.round(a.netDebtCr)}
                  onChange={(e) => setA((p) => ({ ...p, netDebtCr: Number(e.target.value) }))}
                />
              </div>
              <div>
                <Label>Shares (Cr)</Label>
                <Input
                  className="mt-1.5"
                  type="number"
                  value={a.sharesOutstandingCr}
                  onChange={(e) => setA((p) => ({ ...p, sharesOutstandingCr: Number(e.target.value) }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Intrinsic value</CardTitle>
          </CardHeader>
          <CardContent>
            {!result ? (
              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin mr-2" /> Computing…</div>
            ) : (
              <>
                <div className="grid gap-3 md:grid-cols-4">
                  <BigStat label="Intrinsic value / share" value={fmtINR(result.intrinsicValuePerShare, { decimals: true })} />
                  <BigStat label="Equity value" value={fmtCr(result.equityValueCr)} />
                  <BigStat label="Enterprise value" value={fmtCr(result.enterpriseValueCr)} />
                  <BigStat
                    label="Upside vs price"
                    value={upside === null ? "—" : fmtPctValue(upside * 100)}
                    tone={upside !== null ? (upside >= 0 ? "bull" : "bear") : undefined}
                  />
                </div>
                <div className="mt-6 overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-y border-border text-[10px] uppercase tracking-widest text-muted-foreground">
                        <th className="px-3 py-2 text-left font-medium">Year</th>
                        <th className="px-3 py-2 text-right font-medium">Revenue</th>
                        <th className="px-3 py-2 text-right font-medium">EBITDA</th>
                        <th className="px-3 py-2 text-right font-medium">NOPLAT</th>
                        <th className="px-3 py-2 text-right font-medium">Capex</th>
                        <th className="px-3 py-2 text-right font-medium">FCFF</th>
                        <th className="px-3 py-2 text-right font-medium">PV(FCFF)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.schedule.map((y) => (
                        <tr key={y.year} className="border-b border-border/60 last:border-b-0">
                          <td className="px-3 py-1.5 font-mono">Y{y.year}</td>
                          <td className="px-3 py-1.5 text-right num">{fmtNum(y.revenueCr, 0)}</td>
                          <td className="px-3 py-1.5 text-right num">{fmtNum(y.ebitdaCr, 0)}</td>
                          <td className="px-3 py-1.5 text-right num">{fmtNum(y.noplatCr, 0)}</td>
                          <td className="px-3 py-1.5 text-right num">{fmtNum(y.capexCr, 0)}</td>
                          <td className="px-3 py-1.5 text-right num">{fmtNum(y.fcffCr, 0)}</td>
                          <td className="px-3 py-1.5 text-right num">{fmtNum(y.pvFcffCr, 0)}</td>
                        </tr>
                      ))}
                      <tr className="border-t border-border bg-background/40">
                        <td className="px-3 py-1.5" colSpan={6}>Terminal value (PV)</td>
                        <td className="px-3 py-1.5 text-right num font-semibold">{fmtNum(result.pvTerminalValueCr, 0)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3 text-xs">
                  <div><span className="text-muted-foreground">Implied exit EV/EBITDA</span> · {fmtNum(result.impliedExitMultiple, 1)}×</div>
                </div>
                <div className="mt-6">
                  <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Sensitivity — intrinsic value / share</div>
                  <SensitivityGrid sens={result.sensitivity} />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Relative valuation vs peers</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y border-border text-[10px] uppercase tracking-widest text-muted-foreground">
                <th className="px-4 py-2 text-left font-medium">Multiple</th>
                <th className="px-4 py-2 text-right font-medium">{ticker}</th>
                <th className="px-4 py-2 text-right font-medium">Peer median</th>
                <th className="px-4 py-2 text-right font-medium">Peer mean</th>
                <th className="px-4 py-2 text-right font-medium">Premium / (discount)</th>
              </tr>
            </thead>
            <tbody>
              {relativeRows.map((r) => (
                <tr key={r.metric} className="border-b border-border/60 last:border-b-0">
                  <td className="px-4 py-2 uppercase">{r.metric === "evEbitda" ? "EV/EBITDA" : r.metric === "evSales" ? "EV/Sales" : r.metric}</td>
                  <td className="px-4 py-2 text-right num">{Number.isFinite(r.companyValue) ? fmtNum(r.companyValue, 1) : "—"}</td>
                  <td className="px-4 py-2 text-right num">{Number.isFinite(r.peerMedian) ? fmtNum(r.peerMedian, 1) : "—"}</td>
                  <td className="px-4 py-2 text-right num">{Number.isFinite(r.peerMean) ? fmtNum(r.peerMean, 1) : "—"}</td>
                  <td className={cn("px-4 py-2 text-right num", r.premiumDiscount > 0 ? "stat-bear" : r.premiumDiscount < 0 ? "stat-bull" : "")}>
                    {Number.isFinite(r.premiumDiscount) ? fmtPctValue(r.premiumDiscount * 100) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function PctSlider({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span className="font-mono text-xs tabular-nums">{fmtPctValue(value * 100)}</span>
      </div>
      <Slider className="mt-2" value={[value]} min={min} max={max} step={step} onValueChange={(v) => onChange(v[0])} />
    </div>
  );
}

function BigStat({ label, value, tone }: { label: string; value: string; tone?: "bull" | "bear" }) {
  return (
    <div className="rounded-md border border-border bg-background/40 px-3 py-3">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={cn("mt-1 font-mono text-xl font-semibold tabular-nums", tone === "bull" && "stat-bull", tone === "bear" && "stat-bear")}>
        {value}
      </div>
    </div>
  );
}

function SensitivityGrid({ sens }: { sens: DCFResult["sensitivity"] }) {
  const waccs = Array.from(new Set(sens.map((s) => s.wacc))).sort((a, b) => a - b);
  const grs = Array.from(new Set(sens.map((s) => s.terminalGrowth))).sort((a, b) => a - b);
  return (
    <div className="overflow-x-auto">
      <table className="text-xs">
        <thead>
          <tr>
            <th className="border-b border-border px-2 py-1 text-muted-foreground">WACC ↓ / g →</th>
            {grs.map((g) => (
              <th key={g} className="border-b border-border px-2 py-1 text-muted-foreground">{fmtPctValue(g * 100)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {waccs.map((w) => (
            <tr key={w}>
              <th className="border-b border-border px-2 py-1 text-left text-muted-foreground">{fmtPctValue(w * 100)}</th>
              {grs.map((g) => {
                const cell = sens.find((s) => s.wacc === w && s.terminalGrowth === g);
                return (
                  <td key={g} className="border-b border-border px-2 py-1 text-right num">
                    {cell ? fmtINR(cell.intrinsicValuePerShare) : "—"}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function rampGrowth(start: number, n: number) {
  // Fade growth to a sustainable rate by year n
  const terminal = Math.min(0.07, Math.max(0.03, start * 0.4));
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / Math.max(n - 1, 1);
    out.push(start * (1 - t) + terminal * t);
  }
  return out;
}
