import Link from "next/link";
import { ArrowUpRight, ArrowDownRight, FileText, ShieldCheck, Eye, Briefcase } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { marketData } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fmtCr, fmtPctValue, fmtDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;
  const md = marketData();

  const [indices, watchlistItems, recentReports, activeTheses] = await Promise.all([
    md.getMarketSnapshot(),
    prisma.watchlistItem.findMany({
      where: { watchlist: { userId } },
      include: { company: true },
      orderBy: { addedAt: "desc" },
      take: 8,
    }),
    prisma.researchReport.findMany({
      where: { userId },
      include: { company: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.investmentThesis.findMany({
      where: { userId, status: { in: ["ACTIVE", "STRENGTHENED", "WEAKENED"] } },
      include: { company: true, checks: { orderBy: { createdAt: "desc" }, take: 1 } },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Welcome back{session?.user?.name ? `, ${session.user.name.split(" ")[0]}` : ""}. Markets in real-time, your work in one place.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {indices.map((idx) => (
          <div key={idx.index} className="rounded-lg border border-border bg-card p-3">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{idx.index}</div>
            <div className="mt-1 font-mono text-lg font-semibold tabular-nums">
              {idx.level.toLocaleString("en-IN", { maximumFractionDigits: 1 })}
            </div>
            <div className={cn("mt-0.5 flex items-center gap-1 text-xs font-medium", idx.changePct >= 0 ? "stat-bull" : "stat-bear")}>
              {idx.changePct >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {fmtPctValue(idx.changePct * 100)}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Eye className="h-3.5 w-3.5" /> Watchlist</CardTitle>
            <Link href="/watchlist" className="text-xs text-muted-foreground hover:text-foreground">View all →</Link>
          </CardHeader>
          <CardContent className="p-0">
            {watchlistItems.length === 0 ? (
              <EmptyState
                icon={Eye}
                title="No watchlist items yet"
                cta={{ href: "/research", label: "Find a company" }}
              />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y border-border text-[10px] uppercase tracking-widest text-muted-foreground">
                    <th className="px-5 py-2 text-left font-medium">Ticker</th>
                    <th className="px-5 py-2 text-left font-medium">Company</th>
                    <th className="px-5 py-2 text-right font-medium">Target</th>
                    <th className="px-5 py-2 text-right font-medium">Added</th>
                  </tr>
                </thead>
                <tbody>
                  {watchlistItems.map((it) => (
                    <tr key={it.id} className="border-b border-border/60 last:border-b-0 hover:bg-accent/30">
                      <td className="px-5 py-2 font-mono text-xs font-semibold">
                        <Link href={`/research/${it.company.ticker}`} className="hover:underline">
                          {it.company.ticker}
                        </Link>
                      </td>
                      <td className="px-5 py-2 text-muted-foreground">{it.company.name}</td>
                      <td className="px-5 py-2 text-right num">{it.targetPrice ? `₹${it.targetPrice.toLocaleString("en-IN")}` : "—"}</td>
                      <td className="px-5 py-2 text-right text-xs text-muted-foreground">{fmtDate(it.addedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5" /> Thesis Monitor</CardTitle>
            <Link href="/thesis-monitor" className="text-xs text-muted-foreground hover:text-foreground">All →</Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {activeTheses.length === 0 ? (
              <EmptyState icon={ShieldCheck} title="No active theses" cta={{ href: "/thesis-monitor", label: "Record one" }} small />
            ) : (
              activeTheses.map((t) => {
                const last = t.checks[0];
                const verdict = last?.verdict ?? "INTACT";
                return (
                  <Link
                    key={t.id}
                    href={`/thesis-monitor/${t.id}`}
                    className="block rounded-md border border-border bg-background/40 p-3 hover:border-foreground/30"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-mono text-xs font-semibold">{t.company.ticker}</div>
                      <VerdictBadge verdict={verdict} />
                    </div>
                    <div className="mt-1 text-sm">{t.title}</div>
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><FileText className="h-3.5 w-3.5" /> Recent reports</CardTitle>
            <Link href="/research" className="text-xs text-muted-foreground hover:text-foreground">New report →</Link>
          </CardHeader>
          <CardContent>
            {recentReports.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No reports yet"
                cta={{ href: "/research", label: "Generate your first" }}
              />
            ) : (
              <ul className="space-y-2">
                {recentReports.map((r) => (
                  <li key={r.id}>
                    <Link
                      href={`/research/${r.company.ticker}`}
                      className="flex items-center justify-between rounded-md border border-border bg-background/40 p-3 hover:border-foreground/30"
                    >
                      <div className="flex flex-col">
                        <div className="text-sm font-medium">{r.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {r.company.ticker} · {r.kind.replace("_", " ").toLowerCase()} · {fmtDate(r.createdAt)}
                        </div>
                      </div>
                      <Badge variant="outline">{r.status}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Briefcase className="h-3.5 w-3.5" /> Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Link href="/research" className="rounded-md border border-border bg-background/40 p-3 hover:border-foreground/30">
              <div className="text-sm font-medium">New research report</div>
              <div className="text-xs text-muted-foreground">Run all six agents on a ticker</div>
            </Link>
            <Link href="/thesis-monitor" className="rounded-md border border-border bg-background/40 p-3 hover:border-foreground/30">
              <div className="text-sm font-medium">Record a thesis</div>
              <div className="text-xs text-muted-foreground">Watch it continuously for falsification</div>
            </Link>
            <Link href="/portfolio" className="rounded-md border border-border bg-background/40 p-3 hover:border-foreground/30">
              <div className="text-sm font-medium">Track portfolio</div>
              <div className="text-xs text-muted-foreground">Per-holding thesis and P&L</div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  cta,
  small,
}: {
  icon: any;
  title: string;
  cta?: { href: string; label: string };
  small?: boolean;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-2 text-center", small ? "p-4" : "p-8")}>
      <Icon className="h-5 w-5 text-muted-foreground" />
      <div className="text-sm text-muted-foreground">{title}</div>
      {cta && (
        <Link href={cta.href} className="text-xs text-primary hover:underline">
          {cta.label} →
        </Link>
      )}
    </div>
  );
}

function VerdictBadge({ verdict }: { verdict: string }) {
  if (verdict === "STRENGTHENED" || verdict === "BULLISH") return <Badge variant="bull">Strengthened</Badge>;
  if (verdict === "WEAKENED") return <Badge variant="warn">Weakened</Badge>;
  if (verdict === "BROKEN") return <Badge variant="bear">Broken</Badge>;
  return <Badge variant="outline">Intact</Badge>;
}
