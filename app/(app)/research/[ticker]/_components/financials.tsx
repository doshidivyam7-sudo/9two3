import type { FinancialPoint } from "@/lib/data/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FinancialTrend } from "@/components/charts/financial-trend";
import { cagr, fmtCr, fmtPctValue } from "@/lib/format";

interface Props {
  annual: FinancialPoint[];
  quarterly: FinancialPoint[];
}

export function FinancialsSection({ annual, quarterly }: Props) {
  const sorted = [...annual].sort((a, b) => a.fiscalYear - b.fiscalYear);
  const series = sorted.map((r) => ({
    fiscalYear: r.fiscalYear,
    revenue: r.revenueCr,
    ebitda: r.ebitdaCr,
    pat: r.patCr,
    cfo: r.cfoCr,
    fcf: r.fcfCr,
    capex: r.capexCr ? -Math.abs(r.capexCr) : undefined,
    roce: r.roce ? r.roce * 100 : undefined,
    roe: r.roe ? r.roe * 100 : undefined,
    netDebt: r.netDebtCr,
    debtToEquity: r.debtToEquity,
    ebitdaMargin: r.ebitdaMargin ? r.ebitdaMargin * 100 : undefined,
    patMargin: r.patMargin ? r.patMargin * 100 : undefined,
    receivableDays: r.receivableDays,
    payableDays: r.payableDays,
    inventoryDays: r.inventoryDays,
  }));

  const years = sorted.length;
  const firstRev = sorted[0]?.revenueCr ?? 0;
  const lastRev = sorted[sorted.length - 1]?.revenueCr ?? 0;
  const firstEbitda = sorted[0]?.ebitdaCr ?? 0;
  const lastEbitda = sorted[sorted.length - 1]?.ebitdaCr ?? 0;
  const firstPat = sorted[0]?.patCr ?? 0;
  const lastPat = sorted[sorted.length - 1]?.patCr ?? 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label={`${years - 1}Y Revenue CAGR`} value={fmtPctValue((cagr(firstRev, lastRev, years - 1) ?? 0) * 100)} />
        <StatCard label={`${years - 1}Y EBITDA CAGR`} value={fmtPctValue((cagr(firstEbitda, lastEbitda, years - 1) ?? 0) * 100)} />
        <StatCard label={`${years - 1}Y PAT CAGR`} value={fmtPctValue((cagr(firstPat, lastPat, years - 1) ?? 0) * 100)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Revenue</CardTitle></CardHeader>
          <CardContent>
            <FinancialTrend data={series} series={[{ key: "revenue", label: "Revenue (Cr)", type: "bar" }]} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>EBITDA</CardTitle></CardHeader>
          <CardContent>
            <FinancialTrend data={series} series={[{ key: "ebitda", label: "EBITDA (Cr)", type: "bar", color: "hsl(158, 64%, 50%)" }]} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>PAT</CardTitle></CardHeader>
          <CardContent>
            <FinancialTrend data={series} series={[{ key: "pat", label: "PAT (Cr)", type: "bar", color: "hsl(38, 92%, 60%)" }]} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Cash flow</CardTitle></CardHeader>
          <CardContent>
            <FinancialTrend
              data={series}
              series={[
                { key: "cfo", label: "CFO", type: "area", color: "hsl(217, 91%, 60%)" },
                { key: "fcf", label: "FCF", type: "area", color: "hsl(158, 64%, 50%)" },
              ]}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>ROCE & ROE</CardTitle></CardHeader>
          <CardContent>
            <FinancialTrend
              data={series}
              series={[
                { key: "roce", label: "ROCE %", type: "line", color: "hsl(217, 91%, 60%)" },
                { key: "roe", label: "ROE %", type: "line", color: "hsl(158, 64%, 50%)" },
              ]}
              formatY="percent"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Margins</CardTitle></CardHeader>
          <CardContent>
            <FinancialTrend
              data={series}
              series={[
                { key: "ebitdaMargin", label: "EBITDA margin %", type: "line", color: "hsl(217, 91%, 60%)" },
                { key: "patMargin", label: "PAT margin %", type: "line", color: "hsl(38, 92%, 60%)" },
              ]}
              formatY="percent"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Debt & leverage</CardTitle></CardHeader>
          <CardContent>
            <FinancialTrend
              data={series}
              series={[
                { key: "netDebt", label: "Net debt (Cr)", type: "bar", color: "hsl(0, 84%, 60%)" },
              ]}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Working capital days</CardTitle></CardHeader>
          <CardContent>
            <FinancialTrend
              data={series}
              series={[
                { key: "receivableDays", label: "Receivable days", type: "line", color: "hsl(217, 91%, 60%)" },
                { key: "payableDays", label: "Payable days", type: "line", color: "hsl(158, 64%, 50%)" },
                { key: "inventoryDays", label: "Inventory days", type: "line", color: "hsl(38, 92%, 60%)" },
              ]}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Annual financial table</CardTitle></CardHeader>
        <CardContent className="p-0 overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y border-border text-[10px] uppercase tracking-widest text-muted-foreground">
                <th className="px-4 py-2 text-left font-medium sticky left-0 bg-card">Metric (₹ Cr)</th>
                {sorted.map((r) => <th key={r.fiscalYear} className="px-4 py-2 text-right font-medium">FY{String(r.fiscalYear).slice(2)}</th>)}
              </tr>
            </thead>
            <tbody>
              {[
                { key: "revenueCr", label: "Revenue" },
                { key: "ebitdaCr", label: "EBITDA" },
                { key: "patCr", label: "PAT" },
                { key: "cfoCr", label: "CFO" },
                { key: "fcfCr", label: "FCF" },
                { key: "debtCr", label: "Debt" },
                { key: "cashCr", label: "Cash" },
              ].map((row) => (
                <tr key={row.key} className="border-b border-border/60 last:border-b-0">
                  <td className="px-4 py-2 sticky left-0 bg-card text-muted-foreground">{row.label}</td>
                  {sorted.map((r) => (
                    <td key={r.fiscalYear} className="px-4 py-2 text-right num">
                      {fmtCr((r as any)[row.key] ?? null, "")}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="border-b border-border/60">
                <td className="px-4 py-2 sticky left-0 bg-card text-muted-foreground">ROCE</td>
                {sorted.map((r) => (
                  <td key={r.fiscalYear} className="px-4 py-2 text-right num">
                    {r.roce ? fmtPctValue(r.roce * 100) : "—"}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-border/60">
                <td className="px-4 py-2 sticky left-0 bg-card text-muted-foreground">ROE</td>
                {sorted.map((r) => (
                  <td key={r.fiscalYear} className="px-4 py-2 text-right num">
                    {r.roe ? fmtPctValue(r.roe * 100) : "—"}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-card px-4 py-3">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 font-mono text-xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}
