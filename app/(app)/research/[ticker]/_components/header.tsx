"use client";

import { ArrowDownRight, ArrowUpRight, Star } from "lucide-react";
import type { CompanyProfile, PriceQuote } from "@/lib/data/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fmtCr, fmtINR, fmtPctValue } from "@/lib/format";
import { toast } from "sonner";

interface Props {
  profile: CompanyProfile;
  quote?: PriceQuote;
}

export function CompanyHeader({ profile, quote }: Props) {
  async function addToWatchlist() {
    const res = await fetch("/api/watchlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticker: profile.ticker }),
    });
    if (res.ok) toast.success(`${profile.ticker} added to watchlist`);
    else toast.error("Could not add to watchlist");
  }

  const up = (quote?.changePct ?? 0) >= 0;
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono">{profile.ticker}</Badge>
            <Badge variant="secondary">{profile.exchange}</Badge>
            {profile.sector && <Badge variant="outline">{profile.sector}</Badge>}
            {profile.industry && <Badge variant="outline">{profile.industry}</Badge>}
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">{profile.name}</h1>
          {profile.description && (
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground line-clamp-3">{profile.description}</p>
          )}
        </div>
        <div className="flex flex-col items-start gap-3 md:items-end">
          <div className="flex items-end gap-3">
            <div className="font-mono text-3xl font-semibold tabular-nums">
              {quote ? fmtINR(quote.price, { decimals: true }) : "—"}
            </div>
            {quote && (
              <div className={cn("flex items-center gap-0.5 pb-1.5 text-sm font-medium", up ? "stat-bull" : "stat-bear")}>
                {up ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                {fmtPctValue(quote.changePct * 100)}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={addToWatchlist}>
              <Star className="h-3.5 w-3.5" /> Watch
            </Button>
          </div>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="Market Cap" value={profile.marketCapCr ? fmtCr(profile.marketCapCr) : "—"} />
        <Stat label="Sector" value={profile.sector ?? "—"} />
        <Stat label="Industry" value={profile.industry ?? "—"} />
        <Stat label="Currency" value={profile.currency} />
        <Stat label="Country" value={profile.country} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background/40 px-3 py-2">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-0.5 truncate text-sm font-medium">{value}</div>
    </div>
  );
}
