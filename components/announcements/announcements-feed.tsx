"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Loader2, Megaphone, Filter, BellRing } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Category =
  | "RESULTS" | "DIVIDEND" | "BOARD_MEETING" | "CAPITAL_RAISE" | "ALLOTMENT"
  | "MA" | "CREDIT_RATING" | "INSIDER_TRADE" | "CAPEX" | "ORDER_WIN"
  | "REGULATORY" | "MANAGEMENT_CHANGE" | "OTHER";

interface Announcement {
  id: string;
  ticker: string;
  companyName: string;
  category: Category;
  headline: string;
  summary: string;
  announcedAt: string;
  source: "NSE" | "BSE" | "SEBI" | "Company" | "Other";
  impact: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  isMaterial: boolean;
}

const CATEGORY_LABELS: Record<Category, string> = {
  RESULTS: "Results",
  DIVIDEND: "Dividend",
  BOARD_MEETING: "Board",
  CAPITAL_RAISE: "Cap raise",
  ALLOTMENT: "Allotment",
  MA: "M&A",
  CREDIT_RATING: "Rating",
  INSIDER_TRADE: "Insider",
  CAPEX: "Capex",
  ORDER_WIN: "Order win",
  REGULATORY: "Regulatory",
  MANAGEMENT_CHANGE: "Mgmt",
  OTHER: "Other",
};

interface Props {
  // Empty → global feed; set to filter by ticker.
  ticker?: string;
  limit?: number;
  title?: string;
  showFilters?: boolean;
  compact?: boolean;
}

export function AnnouncementsFeed({ ticker, limit = 25, title, showFilters = true, compact = false }: Props) {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<Category | "ALL">("ALL");
  const [materialOnly, setMaterialOnly] = useState(false);

  useEffect(() => {
    let live = true;
    setLoading(true);
    const url = ticker
      ? `/api/companies/${ticker}/announcements?limit=${limit}`
      : `/api/announcements?limit=${limit}${materialOnly ? "&material=1" : ""}${category !== "ALL" ? `&category=${category}` : ""}`;
    fetch(url)
      .then((r) => r.json())
      .then((d) => { if (live) setItems(d.items ?? []); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [ticker, limit, category, materialOnly]);

  const filtered = ticker
    ? items.filter((it) => category === "ALL" || it.category === category)
        .filter((it) => !materialOnly || it.isMaterial)
    : items;

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="h-3.5 w-3.5" /> {title ?? "Corporate Announcements"}
        </CardTitle>
        {showFilters && (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant={materialOnly ? "default" : "outline"}
              onClick={() => setMaterialOnly((m) => !m)}
            >
              <BellRing className="h-3 w-3" /> Material only
            </Button>
            <div className="flex items-center gap-1">
              <Filter className="h-3 w-3 text-muted-foreground" />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category | "ALL")}
                className="h-8 rounded-md border border-input bg-transparent px-2 text-xs"
              >
                <option value="ALL">All categories</option>
                {(Object.keys(CATEGORY_LABELS) as Category[]).map((c) => (
                  <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className={cn(compact ? "p-0" : "p-0")}>
        {loading ? (
          <div className="flex items-center justify-center p-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading announcements…
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No announcements match the current filters.</div>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((a) => (
              <AnnouncementItem key={a.id} a={a} hideTicker={!!ticker} compact={compact} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function AnnouncementItem({ a, hideTicker, compact }: { a: Announcement; hideTicker?: boolean; compact?: boolean }) {
  const ago = relativeAgo(new Date(a.announcedAt));
  return (
    <li className={cn("px-5", compact ? "py-2.5" : "py-3.5")}>
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex flex-wrap items-baseline gap-2">
          {!hideTicker && (
            <Link href={`/research/${a.ticker}`} className="font-mono text-xs font-semibold hover:underline">
              {a.ticker}
            </Link>
          )}
          <CategoryBadge category={a.category} />
          {a.isMaterial && <Badge variant="warn" className="text-[9px]">Material</Badge>}
          <ImpactBadge impact={a.impact} />
        </div>
        <div className="text-[10px] text-muted-foreground whitespace-nowrap">
          {a.source} · {ago}
        </div>
      </div>
      <div className="mt-1 text-sm font-medium">{a.headline}</div>
      {/* Max 3-liner summary — line-clamped defensively */}
      <p className="mt-1 text-xs text-muted-foreground line-clamp-3">{a.summary}</p>
    </li>
  );
}

function CategoryBadge({ category }: { category: Category }) {
  return <Badge variant="outline" className="text-[9px]">{CATEGORY_LABELS[category]}</Badge>;
}

function ImpactBadge({ impact }: { impact: Announcement["impact"] }) {
  if (impact === "POSITIVE") return <Badge variant="bull" className="text-[9px]">Positive</Badge>;
  if (impact === "NEGATIVE") return <Badge variant="bear" className="text-[9px]">Negative</Badge>;
  return null;
}

function relativeAgo(d: Date): string {
  const ms = Date.now() - d.getTime();
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}
