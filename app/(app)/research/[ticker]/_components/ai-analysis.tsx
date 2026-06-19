"use client";

import { useState } from "react";
import { Brain, Loader2, ShieldAlert, TrendingDown, TrendingUp, Target, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fmtINR, fmtPctValue } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  ticker: string;
}

export function AIAnalysisSection({ ticker }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch(`/api/ai/research`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker }),
      });
      if (!res.ok) {
        toast.error("Could not generate report.");
        return;
      }
      const json = await res.json();
      setData(json);
      toast.success("Report generated.");
    } finally {
      setLoading(false);
    }
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
          <Brain className="h-6 w-6 text-primary" />
          <div className="text-base font-semibold">Generate institutional research</div>
          <p className="max-w-md text-sm text-muted-foreground">
            Run six agents — Research, Financial, Risk, Valuation, Earnings, Thesis — in parallel
            to produce a decision-grade report for {ticker}.
          </p>
          <Button onClick={generate} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />} Run all agents
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { report, financialAnalysis, risk, dcf } = data;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><Sparkles className="h-3.5 w-3.5" /> Investment thesis</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={recoVariant(report.recommendation)}>{report.recommendation}</Badge>
            <Badge variant="outline">Conviction: {report.conviction}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed">{report.oneLiner}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{report.investmentSummary}</p>

          <div className="grid gap-3 md:grid-cols-3">
            <ScenarioCard kind="bear" data={report.scenarios?.bear} />
            <ScenarioCard kind="base" data={report.scenarios?.base} />
            <ScenarioCard kind="bull" data={report.scenarios?.bull} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <SectionLabel>Growth drivers</SectionLabel>
              <BulletList items={report.growthDrivers} />
            </div>
            <div>
              <SectionLabel>Competitive advantages</SectionLabel>
              <BulletList items={report.competitiveAdvantages} />
            </div>
            <div>
              <SectionLabel>Catalysts</SectionLabel>
              <ul className="space-y-2 text-sm">
                {(report.catalysts ?? []).map((c: any, i: number) => (
                  <li key={i} className="rounded-md border border-border bg-background/40 p-2.5">
                    <div className="flex items-baseline justify-between">
                      <span className="font-medium">{c.title}</span>
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{c.timeframe}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{c.description}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <SectionLabel>Key risks</SectionLabel>
              <ul className="space-y-2 text-sm">
                {(report.risks ?? []).map((r: any, i: number) => (
                  <li key={i} className="rounded-md border border-border bg-background/40 p-2.5">
                    <div className="flex items-baseline justify-between">
                      <span className="font-medium">{r.title}</span>
                      <Badge variant={r.severity === "HIGH" ? "bear" : r.severity === "MEDIUM" ? "warn" : "outline"}>{r.severity}</Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{r.description}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {report.redFlags?.length > 0 && (
            <div className="rounded-md border border-[hsl(var(--bear))]/30 bg-[hsl(var(--bear))]/5 p-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-[hsl(var(--bear))]">
                <ShieldAlert className="h-4 w-4" /> Red flags
              </div>
              <ul className="mt-1.5 list-disc pl-6 text-xs">
                {report.redFlags.map((r: string, i: number) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Target className="h-3.5 w-3.5" /> Financial analyst</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Growth: {financialAnalysis.growthQuality}</Badge>
              <Badge variant="outline">Returns: {financialAnalysis.returnProfile}</Badge>
              <Badge variant="outline">B/S: {financialAnalysis.balanceSheetStrength}</Badge>
            </div>
            <p>{financialAnalysis.oneLine}</p>
            <BulletList items={financialAnalysis.observations} />
            <div className="grid grid-cols-3 gap-2 pt-2">
              <Metric label="Rev CAGR" value={fmtPctValue((financialAnalysis.metrics.revenueCagr10y ?? 0) * 100)} />
              <Metric label="Avg ROCE" value={fmtPctValue((financialAnalysis.metrics.avgRoce ?? 0) * 100)} />
              <Metric label="FCF/PAT" value={fmtPctValue((financialAnalysis.metrics.fcfConversion ?? 0) * 100)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldAlert className="h-3.5 w-3.5" /> Risk analyst</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <Badge variant={risk.overallRiskLevel === "VERY_HIGH" || risk.overallRiskLevel === "HIGH" ? "bear" : risk.overallRiskLevel === "MEDIUM" ? "warn" : "bull"}>
                Overall: {risk.overallRiskLevel}
              </Badge>
              <div className="text-xs text-muted-foreground">
                P(permanent loss, 5y): <span className="font-mono">{fmtPctValue((risk.permanentLossProbability ?? 0) * 100)}</span>
              </div>
            </div>
            {risk.forensicScreens?.length > 0 && (
              <div>
                <SectionLabel>Forensic screens</SectionLabel>
                <ul className="space-y-1 text-xs">
                  {risk.forensicScreens.map((s: any, i: number) => (
                    <li key={i} className="flex items-center justify-between rounded border border-border bg-background/40 px-2 py-1.5">
                      <span>{s.check}</span>
                      <Badge variant={s.status === "FAIL" ? "bear" : s.status === "WATCH" ? "warn" : "bull"}>{s.status}</Badge>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <RiskList title="Governance" items={risk.governanceRisks} />
              <RiskList title="Financial" items={risk.financialRisks} />
              <RiskList title="Business" items={risk.businessRisks} />
              <RiskList title="Regulatory" items={risk.regulatoryRisks} />
            </div>
          </CardContent>
        </Card>
      </div>

      {dcf && (
        <Card>
          <CardHeader>
            <CardTitle>Valuation agent · DCF view</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3 text-sm">
            <Metric label="Intrinsic / share" value={fmtINR(dcf.intrinsicValuePerShare, { decimals: true })} />
            <Metric label="Equity value (Cr)" value={fmtINR(dcf.equityValueCr)} />
            <Metric label="Implied exit EV/EBITDA" value={`${dcf.impliedExitMultiple.toFixed(1)}×`} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function recoVariant(rec: string): "bull" | "bear" | "warn" | "default" {
  if (rec === "BUY") return "bull";
  if (rec === "ACCUMULATE") return "default";
  if (rec === "HOLD") return "warn";
  return "bear";
}

function ScenarioCard({ kind, data }: { kind: "bull" | "base" | "bear"; data?: any }) {
  if (!data) return null;
  const meta = {
    bull: { label: "Bull", icon: TrendingUp, tone: "stat-bull" },
    base: { label: "Base", icon: Target, tone: "" },
    bear: { label: "Bear", icon: TrendingDown, tone: "stat-bear" },
  }[kind];
  const Icon = meta.icon;
  return (
    <div className="rounded-md border border-border bg-background/40 p-3">
      <div className="flex items-baseline justify-between">
        <div className={cn("flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest", meta.tone)}>
          <Icon className="h-3 w-3" /> {meta.label}
        </div>
        <div className="text-[10px] text-muted-foreground">P: {fmtPctValue((data.probability ?? 0) * 100)}</div>
      </div>
      <div className="mt-1 font-mono text-lg font-semibold tabular-nums">{fmtINR(data.targetPrice ?? 0)}</div>
      <p className="mt-1 text-xs text-muted-foreground">{data.thesis}</p>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{children}</div>;
}

function BulletList({ items }: { items?: string[] }) {
  if (!items || items.length === 0) return <p className="text-xs text-muted-foreground">—</p>;
  return (
    <ul className="list-disc space-y-1 pl-5 text-sm">
      {items.map((it, i) => <li key={i}>{it}</li>)}
    </ul>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-border bg-background/40 px-3 py-2">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-mono text-sm font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function RiskList({ title, items }: { title: string; items?: any[] }) {
  return (
    <div>
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{title}</div>
      {!items || items.length === 0 ? (
        <div className="text-xs text-muted-foreground">—</div>
      ) : (
        <ul className="space-y-1">
          {items.slice(0, 3).map((r: any, i: number) => (
            <li key={i} className="text-xs"><span className="font-medium">{r.risk}</span>{r.evidence && <span className="text-muted-foreground"> — {r.evidence}</span>}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
