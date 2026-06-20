import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { MarketIndex } from "@/lib/data/types";
import { cn } from "@/lib/utils";
import { fmtPctValue } from "@/lib/format";

interface Props {
  indices: MarketIndex[];
}

export function MarketStrip({ indices }: Props) {
  const broad = indices.filter((i) => i.group === "BROAD");
  const sector = indices.filter((i) => i.group === "SECTOR");
  const vix = indices.filter((i) => i.group === "VOLATILITY");

  return (
    <div className="space-y-3">
      <Row label="Broad market" items={[...broad, ...vix]} prominent />
      {sector.length > 0 && <Row label="Sectors" items={sector} />}
    </div>
  );
}

function Row({ label, items, prominent }: { label: string; items: MarketIndex[]; prominent?: boolean }) {
  return (
    <div>
      <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">{label}</div>
      <div className={cn(
        "grid gap-2",
        prominent ? "grid-cols-3 md:grid-cols-4 xl:grid-cols-7" : "grid-cols-3 md:grid-cols-4 xl:grid-cols-7",
      )}>
        {items.map((idx) => (
          <IndexCell key={idx.index} idx={idx} prominent={prominent} />
        ))}
      </div>
    </div>
  );
}

function IndexCell({ idx, prominent }: { idx: MarketIndex; prominent?: boolean }) {
  const up = idx.changePct >= 0;
  const isVix = idx.group === "VOLATILITY";
  return (
    <div className={cn(
      "rounded-md border border-border bg-card",
      prominent ? "p-3" : "p-2.5",
    )}>
      <div className={cn("uppercase tracking-widest text-muted-foreground", prominent ? "text-[10px]" : "text-[9px]")}>
        {idx.index}
      </div>
      <div className={cn(
        "mt-1 font-mono font-semibold tabular-nums",
        prominent ? "text-lg" : "text-base",
      )}>
        {idx.level.toLocaleString("en-IN", { maximumFractionDigits: isVix ? 2 : 0 })}
      </div>
      <div className={cn(
        "mt-0.5 flex items-center gap-0.5 font-medium",
        prominent ? "text-xs" : "text-[10px]",
        // For VIX, a fall is bullish — colour the up-arrow green only for non-VIX.
        up ? (isVix ? "stat-bear" : "stat-bull") : (isVix ? "stat-bull" : "stat-bear"),
      )}>
        {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
        {fmtPctValue(idx.changePct * 100)}
      </div>
    </div>
  );
}
