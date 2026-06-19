import type { NewsHeadline } from "@/lib/data/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";
import { fmtDate } from "@/lib/format";

export function NewsSection({ news }: { news: NewsHeadline[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>News & filings</CardTitle>
      </CardHeader>
      <CardContent>
        {news.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent items.</p>
        ) : (
          <ul className="divide-y divide-border">
            {news.map((n, i) => (
              <li key={i} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-baseline justify-between gap-3">
                  <a
                    href={n.url ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-medium hover:underline"
                  >
                    {n.headline} {n.url && <ExternalLink className="inline h-3 w-3 text-muted-foreground" />}
                  </a>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {n.source ?? "—"} · {fmtDate(n.publishedAt)}
                  </div>
                </div>
                {n.summary && <p className="mt-1 text-xs text-muted-foreground">{n.summary}</p>}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
