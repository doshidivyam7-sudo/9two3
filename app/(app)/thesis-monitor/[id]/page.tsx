import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fmtDate } from "@/lib/format";
import { MonitorButton } from "./_monitor-button";
import { CheckList } from "./_check-list";

export const dynamic = "force-dynamic";

export default async function ThesisDetail({ params }: { params: { id: string } }) {
  const session = await auth();
  const thesis = await prisma.investmentThesis.findFirst({
    where: { id: params.id, userId: session!.user.id },
    include: { company: true, checks: { orderBy: { createdAt: "desc" }, take: 20 } },
  });
  if (!thesis) notFound();

  const last = thesis.checks[0];
  const indicators = (thesis.leadIndicators as any[]) ?? [];

  return (
    <div className="space-y-6">
      <Link href="/thesis-monitor" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3 w-3" /> All theses
      </Link>

      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="font-mono">{thesis.company.ticker}</Badge>
            <Badge variant="outline">{thesis.conviction}</Badge>
            <Badge variant="outline">{thesis.timeHorizonMonths}M horizon</Badge>
            <VerdictBadge verdict={last?.verdict ?? "INTACT"} />
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">{thesis.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            <Link href={`/research/${thesis.company.ticker}`} className="hover:underline">
              {thesis.company.name} <ExternalLink className="inline h-3 w-3" />
            </Link>
          </p>
        </div>
        <MonitorButton thesisId={thesis.id} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Thesis</CardTitle></CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{thesis.thesis}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Targets</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Target price" value={thesis.targetPrice ? `₹${thesis.targetPrice.toLocaleString("en-IN")}` : "—"} />
            <Row label="Stop loss" value={thesis.stopLoss ? `₹${thesis.stopLoss.toLocaleString("en-IN")}` : "—"} />
            <Row label="Created" value={fmtDate(thesis.createdAt)} />
            <Row label="Last monitored" value={thesis.lastMonitoredAt ? fmtDate(thesis.lastMonitoredAt) : "—"} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Lead indicators</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y border-border text-[10px] uppercase tracking-widest text-muted-foreground">
                <th className="px-3 py-2 text-left font-medium">Indicator</th>
                <th className="px-3 py-2 text-left font-medium">Target</th>
                <th className="px-3 py-2 text-left font-medium">Direction</th>
              </tr>
            </thead>
            <tbody>
              {indicators.map((ind: any, i: number) => (
                <tr key={i} className="border-b border-border/60 last:border-b-0">
                  <td className="px-3 py-2">{ind.indicator}</td>
                  <td className="px-3 py-2 font-medium">{ind.target}</td>
                  <td className="px-3 py-2"><Badge variant="outline">{ind.direction}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {thesis.bullCase && <ScenarioCard title="Bull case" body={thesis.bullCase} tone="bull" />}
        {thesis.baseCase && <ScenarioCard title="Base case" body={thesis.baseCase} />}
        {thesis.bearCase && <ScenarioCard title="Bear case" body={thesis.bearCase} tone="bear" />}
      </div>

      <Card>
        <CardHeader><CardTitle>Monitor history</CardTitle></CardHeader>
        <CardContent>
          {thesis.checks.length === 0 ? (
            <p className="text-sm text-muted-foreground">Run a monitor pass to grade this thesis against the latest evidence.</p>
          ) : (
            <CheckList checks={thesis.checks.map((c) => ({
              id: c.id,
              verdict: c.verdict,
              score: c.score,
              reasoning: c.reasoning,
              evidence: c.evidence as any,
              createdAt: c.createdAt.toISOString(),
            }))} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function VerdictBadge({ verdict }: { verdict: string }) {
  if (verdict === "STRENGTHENED") return <Badge variant="bull">Strengthened</Badge>;
  if (verdict === "WEAKENED") return <Badge variant="warn">Weakened</Badge>;
  if (verdict === "BROKEN") return <Badge variant="bear">Broken</Badge>;
  return <Badge variant="outline">Intact</Badge>;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-border/40 pb-1.5 last:border-b-0">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className="font-mono tabular-nums">{value}</span>
    </div>
  );
}

function ScenarioCard({ title, body, tone }: { title: string; body: string; tone?: "bull" | "bear" }) {
  const c = tone === "bull" ? "border-[hsl(var(--bull))]/30" : tone === "bear" ? "border-[hsl(var(--bear))]/30" : "";
  return (
    <Card className={c}>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent><p className="whitespace-pre-wrap text-sm">{body}</p></CardContent>
    </Card>
  );
}
