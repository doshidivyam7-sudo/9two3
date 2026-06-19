import Link from "next/link";
import { Eye } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { marketData } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fmtCr, fmtINR, fmtPctValue, fmtDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function WatchlistPage() {
  const session = await auth();
  const items = await prisma.watchlistItem.findMany({
    where: { watchlist: { userId: session!.user.id } },
    include: { company: true, watchlist: true },
    orderBy: { addedAt: "desc" },
  });

  const md = marketData();
  const enriched = await Promise.all(
    items.map(async (it) => {
      const q = await md.getQuote(it.company.ticker);
      return { ...it, price: q?.price, changePct: q?.changePct };
    }),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <Eye className="h-5 w-5" /> Watchlist
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track companies you care about. Set target prices and short theses.
        </p>
      </div>

      {enriched.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
            <Eye className="h-6 w-6 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">No watchlist items yet.</div>
            <Link href="/research" className="text-xs text-primary hover:underline">Find a company →</Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader><CardTitle>Tracking {enriched.length} stocks</CardTitle></CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y border-border text-[10px] uppercase tracking-widest text-muted-foreground">
                  <th className="px-4 py-2 text-left font-medium">Ticker</th>
                  <th className="px-4 py-2 text-left font-medium">Company</th>
                  <th className="px-4 py-2 text-right font-medium">LTP</th>
                  <th className="px-4 py-2 text-right font-medium">Chg</th>
                  <th className="px-4 py-2 text-right font-medium">Target</th>
                  <th className="px-4 py-2 text-right font-medium">Upside</th>
                  <th className="px-4 py-2 text-right font-medium">Mkt Cap</th>
                  <th className="px-4 py-2 text-right font-medium">Added</th>
                </tr>
              </thead>
              <tbody>
                {enriched.map((it) => {
                  const upside = it.targetPrice && it.price ? it.targetPrice / it.price - 1 : null;
                  return (
                    <tr key={it.id} className="border-b border-border/60 last:border-b-0 hover:bg-accent/30">
                      <td className="px-4 py-2 font-mono text-xs font-semibold">
                        <Link href={`/research/${it.company.ticker}`} className="hover:underline">{it.company.ticker}</Link>
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">{it.company.name}</td>
                      <td className="px-4 py-2 text-right num">{it.price ? fmtINR(it.price, { decimals: true }) : "—"}</td>
                      <td className={cn("px-4 py-2 text-right num", (it.changePct ?? 0) >= 0 ? "stat-bull" : "stat-bear")}>
                        {typeof it.changePct === "number" ? fmtPctValue(it.changePct * 100) : "—"}
                      </td>
                      <td className="px-4 py-2 text-right num">{it.targetPrice ? fmtINR(it.targetPrice) : "—"}</td>
                      <td className={cn("px-4 py-2 text-right num", upside !== null && upside >= 0 ? "stat-bull" : upside !== null ? "stat-bear" : "")}>
                        {upside !== null ? fmtPctValue(upside * 100) : "—"}
                      </td>
                      <td className="px-4 py-2 text-right num">{it.company.marketCapCr ? fmtCr(it.company.marketCapCr, "") : "—"}</td>
                      <td className="px-4 py-2 text-right text-xs text-muted-foreground">{fmtDate(it.addedAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
