"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Suggestion {
  ticker: string;
  name: string;
  exchange: string;
}

export function ResearchSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!q.trim()) {
      setItems([]);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    fetch(`/api/companies/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [q]);

  function go(ticker: string) {
    setOpen(false);
    setQ("");
    router.push(`/research/${ticker}`);
  }

  return (
    <div ref={wrapRef} className="relative w-full md:w-96">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="RELIANCE, TCS, INOXINDIA, HUDCO…"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter") go(q.toUpperCase().trim());
        }}
        className="pl-9"
        autoComplete="off"
      />
      {loading && <Loader2 className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
      {open && (items.length > 0 || q) && (
        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-md border border-border bg-popover shadow-lg">
          {items.length === 0 ? (
            <button
              onClick={() => go(q.toUpperCase().trim())}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-accent"
            >
              Go to <span className="font-mono">{q.toUpperCase().trim()}</span>
            </button>
          ) : (
            items.map((s) => (
              <Link
                key={s.ticker}
                href={`/research/${s.ticker}`}
                onClick={() => setOpen(false)}
                className="flex items-baseline justify-between px-3 py-2 text-sm hover:bg-accent"
              >
                <span className="font-mono text-xs font-semibold">{s.ticker}</span>
                <span className="ml-3 truncate text-muted-foreground">{s.name}</span>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
