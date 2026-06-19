import type { CompanyProfile, FinancialPoint, SegmentMix } from "@/lib/data/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SegmentPie } from "@/components/charts/segment-pie";
import { fmtCr, fmtPctValue } from "@/lib/format";

interface Props {
  profile: CompanyProfile;
  annual: FinancialPoint[];
  segments: SegmentMix[];
}

export function OverviewSection({ profile, segments, annual }: Props) {
  const latestSegment = segments[0];
  const last = annual[0];

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Business Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-foreground/90">{profile.description ?? "No description available."}</p>
          {profile.businessModel && (
            <div className="mt-5">
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Business model</div>
              <p className="text-sm">{profile.businessModel}</p>
            </div>
          )}
          {profile.geographicMix && profile.geographicMix.length > 0 && (
            <div className="mt-5">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Geographic mix</div>
              <div className="space-y-1.5">
                {profile.geographicMix.map((g) => (
                  <div key={g.region}>
                    <div className="flex justify-between text-xs">
                      <span>{g.region}</span>
                      <span className="font-mono tabular-nums">{fmtPctValue(g.pct * 100)}</span>
                    </div>
                    <div className="h-1 rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${g.pct * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Segment revenue (FY{latestSegment?.fiscalYear ?? "—"})</CardTitle>
        </CardHeader>
        <CardContent>
          {latestSegment ? (
            <>
              <SegmentPie data={latestSegment.segments.map((s) => ({ name: s.name, value: s.revenueCr }))} />
              <ul className="mt-3 space-y-1.5">
                {latestSegment.segments.map((s) => (
                  <li key={s.name} className="flex items-baseline justify-between text-xs">
                    <span className="truncate">{s.name}</span>
                    <span className="ml-2 font-mono tabular-nums">{fmtPctValue(s.pctOfTotal * 100)}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Segment data unavailable.</p>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Industry & positioning</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Sector</div>
              <div className="mt-1 text-sm">{profile.sector ?? "—"}</div>
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Industry</div>
              <div className="mt-1 text-sm">{profile.industry ?? "—"}</div>
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Latest FY revenue</div>
              <div className="mt-1 text-sm">{last?.revenueCr ? fmtCr(last.revenueCr) : "—"}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
