import { Scale } from "lucide-react";
import { CompareView } from "./_view";

export const dynamic = "force-dynamic";

export const metadata = { title: "Compare" };

interface Props {
  searchParams: { tickers?: string };
}

export default function ComparePage({ searchParams }: Props) {
  const initial = (searchParams.tickers ?? "")
    .split(",")
    .map((t) => t.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <Scale className="h-5 w-5" /> Compare
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          Pick 2–5 tickers and see them side-by-side: scale, growth, margins,
          returns, multiples, balance sheet, and the latest guidance. Use it
          before you pick which one to size up.
        </p>
      </div>
      <CompareView initial={initial} />
    </div>
  );
}
