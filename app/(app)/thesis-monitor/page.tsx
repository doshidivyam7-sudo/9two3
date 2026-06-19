import Link from "next/link";
import { ShieldCheck, Plus } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fmtDate } from "@/lib/format";
import { NewThesisDialog } from "./_new-thesis";

export const dynamic = "force-dynamic";

export default async function ThesisMonitorPage() {
  const session = await auth();
  const theses = await prisma.investmentThesis.findMany({
    where: { userId: session!.user.id },
    include: { company: true, checks: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <ShieldCheck className="h-5 w-5" /> Thesis Monitor<span className="text-xs text-muted-foreground">™</span>
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Record what you believe and the indicators that would falsify it. The agent watches
            new results, news, and concall commentary and grades the thesis on every check.
          </p>
        </div>
        <NewThesisDialog trigger={<Button><Plus className="h-3.5 w-3.5" /> New thesis</Button>} />
      </div>

      {theses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <div className="text-base font-semibold">No theses yet</div>
            <p className="max-w-md text-sm text-muted-foreground">
              Record your first investment thesis. State what you believe, the catalysts that should play out,
              and the indicators that would prove you wrong.
            </p>
            <NewThesisDialog trigger={<Button>Record a thesis</Button>} />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {theses.map((t) => {
            const last = t.checks[0];
            const verdict = last?.verdict ?? "INTACT";
            return (
              <Link key={t.id} href={`/thesis-monitor/${t.id}`}>
                <Card className="card-hover h-full">
                  <CardHeader className="flex flex-row items-start justify-between">
                    <div>
                      <CardTitle className="text-xs normal-case tracking-normal">{t.company.ticker}</CardTitle>
                      <div className="mt-1 text-sm font-semibold">{t.title}</div>
                    </div>
                    <VerdictBadge verdict={verdict} />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="line-clamp-3 text-xs text-muted-foreground">{t.thesis}</p>
                    <div className="flex flex-wrap gap-1.5 text-[10px]">
                      <Badge variant="outline">{t.conviction}</Badge>
                      <Badge variant="outline">{t.timeHorizonMonths}M horizon</Badge>
                      {t.targetPrice && <Badge variant="outline">TP ₹{t.targetPrice.toLocaleString("en-IN")}</Badge>}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      Last check: {last ? fmtDate(last.createdAt) : "never"}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function VerdictBadge({ verdict }: { verdict: string }) {
  if (verdict === "STRENGTHENED") return <Badge variant="bull">Strengthened</Badge>;
  if (verdict === "WEAKENED") return <Badge variant="warn">Weakened</Badge>;
  if (verdict === "BROKEN") return <Badge variant="bear">Broken</Badge>;
  return <Badge variant="outline">Intact</Badge>;
}
