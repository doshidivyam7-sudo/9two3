"use client";

import { Badge } from "@/components/ui/badge";
import { fmtDate } from "@/lib/format";

interface Check {
  id: string;
  verdict: string;
  score: number;
  reasoning: string;
  evidence: any;
  createdAt: string;
}

export function CheckList({ checks }: { checks: Check[] }) {
  return (
    <ul className="space-y-3">
      {checks.map((c) => {
        const ev = c.evidence ?? {};
        return (
          <li key={c.id} className="rounded-md border border-border bg-background/40 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <VerdictBadge verdict={c.verdict} />
                <span className="font-mono text-xs tabular-nums">
                  score {c.score >= 0 ? "+" : ""}{c.score.toFixed(2)}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground">{fmtDate(c.createdAt)}</span>
            </div>
            {ev.oneLine && <p className="mt-2 text-sm font-medium">{ev.oneLine}</p>}
            <p className="mt-1 text-xs text-muted-foreground whitespace-pre-wrap">{c.reasoning}</p>

            {ev.indicatorChecks?.length > 0 && (
              <div className="mt-3">
                <Label>Indicators</Label>
                <ul className="mt-1 space-y-1">
                  {ev.indicatorChecks.map((i: any, idx: number) => (
                    <li key={idx} className="flex items-baseline justify-between rounded border border-border/60 px-2 py-1 text-xs">
                      <span>{i.indicator}</span>
                      <span className="flex items-center gap-2">
                        <span className="text-muted-foreground">{i.evidence}</span>
                        <Badge variant={i.status === "MET" ? "bull" : i.status === "MISSED" ? "bear" : "outline"}>{i.status}</Badge>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {ev.recommendedAction && (
              <div className="mt-3 text-xs">
                Recommended action: <Badge variant="default">{ev.recommendedAction}</Badge>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function VerdictBadge({ verdict }: { verdict: string }) {
  if (verdict === "STRENGTHENED") return <Badge variant="bull">Strengthened</Badge>;
  if (verdict === "WEAKENED") return <Badge variant="warn">Weakened</Badge>;
  if (verdict === "BROKEN") return <Badge variant="bear">Broken</Badge>;
  return <Badge variant="outline">Intact</Badge>;
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{children}</div>;
}
