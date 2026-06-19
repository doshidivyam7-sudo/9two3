import Link from "next/link";
import { Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MOCK_UNIVERSE } from "@/lib/data/providers/mock";
import { ResearchSearch } from "./_search";

export const dynamic = "force-dynamic";

export default async function ResearchIndexPage() {
  const grouped = MOCK_UNIVERSE.reduce<Record<string, typeof MOCK_UNIVERSE>>((acc, row) => {
    (acc[row.sector] ||= []).push(row);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Company Research</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter any NSE ticker. Six agents will run in parallel and return a decision-grade report.
          </p>
        </div>
        <ResearchSearch />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Search className="h-3.5 w-3.5" /> Quick start</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            {Object.entries(grouped).map(([sector, rows]) => (
              <div key={sector}>
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{sector}</div>
                <ul className="space-y-1">
                  {rows.map((r) => (
                    <li key={r.ticker}>
                      <Link
                        href={`/research/${r.ticker}`}
                        className="flex items-baseline justify-between rounded-md border border-border bg-background/40 px-3 py-2 hover:border-foreground/30"
                      >
                        <span className="font-mono text-xs font-semibold">{r.ticker}</span>
                        <span className="ml-3 truncate text-xs text-muted-foreground">{r.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
