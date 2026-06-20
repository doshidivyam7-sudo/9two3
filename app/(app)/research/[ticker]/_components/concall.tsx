"use client";

import { useEffect, useState } from "react";
import {
  AudioLines,
  ArrowDownRight,
  ArrowUpRight,
  Loader2,
  Mic2,
  TrendingDown,
  TrendingUp,
  Equal,
  ScrollText,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Guidance {
  metric: string;
  value: string;
  horizon: string;
  confidence: "LOW" | "MEDIUM" | "HIGH";
}

interface Segment {
  segment: string;
  commentary: string;
  direction: "ACCELERATING" | "STABLE" | "DECELERATING";
}

interface Summary {
  ticker: string;
  companyName: string;
  period: string;
  callDate: string;
  speakers: string[];
  revenueGuidance: Guidance;
  ebitdaMarginGuidance: Guidance;
  capexGuidance: Guidance;
  orderBookCr?: number;
  orderBookGrowthYoY?: number;
  growthDrivers: string[];
  segmentCommentary: Segment[];
  capitalAllocation: string[];
  risks: string[];
  redFlags: string[];
  notableQuotes: { speaker: string; quote: string; topic: string }[];
  tone: "POSITIVE" | "CAUTIOUS" | "NEGATIVE";
  source: "synthetic" | "uploaded" | "provider";
}

interface Comparison {
  oneLine: string;
  convergentThemes: { theme: string; supportingTickers: string[]; impact: "BULLISH" | "NEUTRAL" | "BEARISH" }[];
  divergentCalls: {
    topic: string;
    focalView: string;
    cohortView: string;
    interpretation: "POSITIVE_DIVERGENCE" | "NEGATIVE_DIVERGENCE" | "AMBIGUOUS";
  }[];
  dimensions: { dimension: string; rows: { ticker: string; value: string }[]; insight: string }[];
  implications: string[];
  sectorRead: "ACCELERATING" | "STABLE" | "DECELERATING" | "MIXED";
}

interface ComparisonResponse {
  focal: Summary;
  peers: Summary[];
  comparison: Comparison;
}

export function ConcallSection({ ticker }: { ticker: string }) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [comparison, setComparison] = useState<ComparisonResponse | null>(null);
  const [loadingCompare, setLoadingCompare] = useState(false);

  useEffect(() => {
    let live = true;
    setLoadingSummary(true);
    fetch(`/api/companies/${ticker}/concall`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (live) setSummary(d); })
      .finally(() => { if (live) setLoadingSummary(false); });
    return () => { live = false; };
  }, [ticker]);

  async function runComparison() {
    setLoadingCompare(true);
    try {
      const res = await fetch(`/api/ai/concall-comparison`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker }),
      });
      if (!res.ok) {
        toast.error("Comparison failed.");
        return;
      }
      setComparison(await res.json());
    } finally {
      setLoadingCompare(false);
    }
  }

  if (loadingSummary) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!summary) {
    return (
      <Card>
        <CardContent className="p-12 text-center text-sm text-muted-foreground">
          No concall summary available for this ticker. Upload a transcript on the Documents tab to extract one.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <SummaryCard summary={summary} />

      {!comparison ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <AudioLines className="h-6 w-6 text-primary" />
            <div className="text-base font-semibold">Compare guidance with peers</div>
            <p className="max-w-md text-sm text-muted-foreground">
              Pulls the latest concall for {summary.companyName} and the peer set, then runs the
              comparison agent — convergent themes, where {ticker} is calling something different,
              and what it means for the thesis.
            </p>
            <Button onClick={runComparison} disabled={loadingCompare}>
              {loadingCompare && <Loader2 className="h-4 w-4 animate-spin" />} Run comparison
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ComparisonView focalTicker={ticker} data={comparison} />
      )}
    </div>
  );
}

function SummaryCard({ summary }: { summary: Summary }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Mic2 className="h-3.5 w-3.5" /> Concall summary · {summary.period}
          </CardTitle>
          <div className="mt-1 text-xs text-muted-foreground">
            {fmtDate(summary.callDate)} · {summary.speakers.slice(0, 3).join(", ")}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ToneBadge tone={summary.tone} />
          {summary.source === "synthetic" && (
            <Badge variant="outline" title="Synthesised from provider data — upload a transcript on Documents tab for verbatim extraction.">
              Synthetic
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 md:grid-cols-3">
          <GuidanceCard label="Revenue" g={summary.revenueGuidance} />
          <GuidanceCard label="EBITDA margin" g={summary.ebitdaMarginGuidance} />
          <GuidanceCard label="Capex" g={summary.capexGuidance} />
        </div>

        {summary.orderBookCr && (
          <div className="rounded-md border border-border bg-background/40 p-3">
            <div className="flex items-baseline justify-between">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Order book
              </div>
              <div className="font-mono text-lg font-semibold tabular-nums">
                ₹{summary.orderBookCr.toLocaleString("en-IN")} Cr
              </div>
            </div>
            {typeof summary.orderBookGrowthYoY === "number" && (
              <div className="mt-1 text-xs text-muted-foreground">
                ~{(summary.orderBookGrowthYoY * 100).toFixed(0)}% YoY growth
              </div>
            )}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <Section title="Growth drivers" items={summary.growthDrivers} />
          <Section title="Capital allocation" items={summary.capitalAllocation} />
          <Section title="Risks flagged" items={summary.risks} />
          <Section title="Red flags" items={summary.redFlags} tone="bear" emptyLabel="None highlighted" />
        </div>

        <div>
          <SectionLabel>Segment commentary</SectionLabel>
          <ul className="mt-2 grid gap-2 md:grid-cols-2">
            {summary.segmentCommentary.map((s, i) => (
              <li key={i} className="rounded-md border border-border bg-background/40 p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">{s.segment}</div>
                  <DirectionBadge dir={s.direction} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{s.commentary}</p>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <SectionLabel>Notable quotes</SectionLabel>
          <ul className="mt-2 space-y-2">
            {summary.notableQuotes.map((q, i) => (
              <li key={i} className="rounded-md border border-border bg-background/40 p-3">
                <div className="flex items-baseline justify-between">
                  <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{q.topic}</div>
                  <div className="text-[10px] text-muted-foreground">{q.speaker}</div>
                </div>
                <p className="mt-1 text-sm italic">"{q.quote}"</p>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

function ComparisonView({ focalTicker, data }: { focalTicker: string; data: ComparisonResponse }) {
  const { focal, peers, comparison } = data;
  const allTickers = [focal.ticker, ...peers.map((p) => p.ticker)];
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Sparkles className="h-3.5 w-3.5" /> Comparison · {focal.ticker} vs {peers.length} peers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">{comparison.oneLine}</p>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="text-muted-foreground">Sector read:</span>
            <SectorBadge read={comparison.sectorRead} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ScrollText className="h-3.5 w-3.5" /> Guidance matrix</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y border-border text-[10px] uppercase tracking-widest text-muted-foreground">
                <th className="px-4 py-2 text-left font-medium sticky left-0 bg-card">Dimension</th>
                {allTickers.map((t) => (
                  <th key={t} className={cn("px-4 py-2 text-left font-medium", t === focalTicker && "text-foreground")}>{t}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparison.dimensions.map((d) => (
                <tr key={d.dimension} className="border-b border-border/60 last:border-b-0 align-top">
                  <td className="px-4 py-3 sticky left-0 bg-card text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    <div>{d.dimension}</div>
                    <div className="mt-1 text-[10px] normal-case tracking-normal font-normal text-muted-foreground/80 max-w-[220px]">
                      {d.insight}
                    </div>
                  </td>
                  {allTickers.map((t) => {
                    const row = d.rows.find((r) => r.ticker.toUpperCase() === t.toUpperCase());
                    return (
                      <td key={t} className={cn("px-4 py-3 text-xs", t === focalTicker && "bg-primary/5")}>{row?.value ?? "—"}</td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Convergent themes</CardTitle>
          </CardHeader>
          <CardContent>
            {comparison.convergentThemes.length === 0 ? (
              <p className="text-xs text-muted-foreground">No themes converge across the cohort.</p>
            ) : (
              <ul className="space-y-2">
                {comparison.convergentThemes.map((t, i) => (
                  <li key={i} className="rounded-md border border-border bg-background/40 p-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="text-sm font-medium">{t.theme}</div>
                      <Badge variant={t.impact === "BULLISH" ? "bull" : t.impact === "BEARISH" ? "bear" : "outline"}>{t.impact}</Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {t.supportingTickers.map((tk) => (
                        <Badge key={tk} variant="outline" className="font-mono text-[10px]">{tk}</Badge>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Where {focalTicker} differs</CardTitle>
          </CardHeader>
          <CardContent>
            {comparison.divergentCalls.length === 0 ? (
              <p className="text-xs text-muted-foreground">{focalTicker} is in line with the cohort across every dimension.</p>
            ) : (
              <ul className="space-y-2">
                {comparison.divergentCalls.map((d, i) => (
                  <li key={i} className="rounded-md border border-border bg-background/40 p-3 text-sm">
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{d.topic}</div>
                      <DivergenceBadge value={d.interpretation} />
                    </div>
                    <div className="mt-1.5 text-xs">
                      <div><span className="text-muted-foreground">{focalTicker}: </span>{d.focalView}</div>
                      <div><span className="text-muted-foreground">Cohort: </span>{d.cohortView}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Implications for {focalTicker}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-1.5 pl-5 text-sm">
            {comparison.implications.map((imp, i) => <li key={i}>{imp}</li>)}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function GuidanceCard({ label, g }: { label: string; g: Guidance }) {
  return (
    <div className="rounded-md border border-border bg-background/40 p-3">
      <div className="flex items-baseline justify-between">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label} · {g.horizon}</div>
        <Badge variant={g.confidence === "HIGH" ? "bull" : g.confidence === "LOW" ? "warn" : "outline"} className="text-[9px]">{g.confidence}</Badge>
      </div>
      <div className="mt-1 font-mono text-base font-semibold tabular-nums">{g.value}</div>
    </div>
  );
}

function Section({ title, items, tone, emptyLabel }: { title: string; items: string[]; tone?: "bear"; emptyLabel?: string }) {
  return (
    <div>
      <SectionLabel>{title}</SectionLabel>
      {!items || items.length === 0 ? (
        <p className="mt-1 text-xs text-muted-foreground">{emptyLabel ?? "—"}</p>
      ) : (
        <ul className={cn("mt-1 list-disc space-y-0.5 pl-5 text-xs", tone === "bear" && "text-[hsl(var(--bear))]")}>
          {items.map((it, i) => <li key={i}>{it}</li>)}
        </ul>
      )}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{children}</div>;
}

function ToneBadge({ tone }: { tone: Summary["tone"] }) {
  if (tone === "POSITIVE") return <Badge variant="bull">Positive</Badge>;
  if (tone === "NEGATIVE") return <Badge variant="bear">Negative</Badge>;
  return <Badge variant="warn">Cautious</Badge>;
}

function DirectionBadge({ dir }: { dir: Segment["direction"] }) {
  if (dir === "ACCELERATING") return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[hsl(var(--bull))]">
      <ArrowUpRight className="h-3 w-3" /> Accelerating
    </span>
  );
  if (dir === "DECELERATING") return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[hsl(var(--bear))]">
      <ArrowDownRight className="h-3 w-3" /> Decelerating
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
      <Equal className="h-3 w-3" /> Stable
    </span>
  );
}

function SectorBadge({ read }: { read: Comparison["sectorRead"] }) {
  if (read === "ACCELERATING") return <Badge variant="bull"><TrendingUp className="h-3 w-3" /> Accelerating</Badge>;
  if (read === "DECELERATING") return <Badge variant="bear"><TrendingDown className="h-3 w-3" /> Decelerating</Badge>;
  if (read === "MIXED") return <Badge variant="warn">Mixed</Badge>;
  return <Badge variant="outline">Stable</Badge>;
}

function DivergenceBadge({ value }: { value: "POSITIVE_DIVERGENCE" | "NEGATIVE_DIVERGENCE" | "AMBIGUOUS" }) {
  if (value === "POSITIVE_DIVERGENCE") return <Badge variant="bull">Positive divergence</Badge>;
  if (value === "NEGATIVE_DIVERGENCE") return <Badge variant="bear">Negative divergence</Badge>;
  return <Badge variant="warn">Ambiguous</Badge>;
}
