import { Filter } from "lucide-react";
import { ScreenerView } from "./_view";

export const dynamic = "force-dynamic";

export const metadata = { title: "Screener" };

export default function ScreenerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <Filter className="h-5 w-5" /> Screener
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          Filter the universe by sector, size, returns, growth and valuation.
          Start from a built-in preset, write a plain-English idea, or compose
          your own filter — then add the survivors to your watchlist in bulk.
        </p>
      </div>
      <ScreenerView />
    </div>
  );
}
