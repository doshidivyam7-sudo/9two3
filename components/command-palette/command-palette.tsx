"use client";

import { create } from "zustand";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, LineChart, Filter, Scale, Eye, Briefcase,
  ShieldCheck, FileText, Settings, Plus, Star, TrendingUp, Search,
} from "lucide-react";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput,
  CommandItem, CommandList, CommandSeparator, CommandShortcut,
} from "@/components/ui/command";

// ---- Global open/close store ------------------------------------------

interface PaletteStore {
  open: boolean;
  initialQuery: string;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  openWith: (query: string) => void;
}

export const useCommandPalette = create<PaletteStore>((set) => ({
  open: false,
  initialQuery: "",
  setOpen: (open) => set({ open, initialQuery: open ? "" : "" }),
  toggle: () => set((s) => ({ open: !s.open, initialQuery: "" })),
  openWith: (initialQuery) => set({ open: true, initialQuery }),
}));

// ---- The palette component -------------------------------------------

interface Suggestion {
  ticker: string;
  name: string;
  exchange: string;
}

const PAGES: { label: string; href: string; icon: any; keywords: string }[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, keywords: "home overview markets indices" },
  { label: "Company Research", href: "/research", icon: LineChart, keywords: "research find company report" },
  { label: "Screener", href: "/screener", icon: Filter, keywords: "filter universe quality compounder value growth" },
  { label: "Compare", href: "/compare", icon: Scale, keywords: "compare side by side multi" },
  { label: "Watchlist", href: "/watchlist", icon: Eye, keywords: "watch tracking targets" },
  { label: "Portfolio", href: "/portfolio", icon: Briefcase, keywords: "holdings positions pnl" },
  { label: "Thesis Monitor", href: "/thesis-monitor", icon: ShieldCheck, keywords: "thesis falsification monitor strengthened broken" },
  { label: "Research Notes", href: "/notes", icon: FileText, keywords: "notes journal channel checks" },
  { label: "Settings", href: "/settings", icon: Settings, keywords: "preferences api keys provider" },
];

const QUICK_ACTIONS: { label: string; href: string; icon: any; keywords: string }[] = [
  { label: "Run a new screen", href: "/screener", icon: Filter, keywords: "new screen filter find" },
  { label: "Record a new thesis", href: "/thesis-monitor", icon: Plus, keywords: "thesis new record investment" },
  { label: "Compare two tickers", href: "/compare", icon: Scale, keywords: "compare new pair" },
];

export function CommandPalette() {
  const router = useRouter();
  const { open, setOpen, initialQuery } = useCommandPalette();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [searching, setSearching] = useState(false);
  // Controlled highlight — so typing a ticker + Enter selects the company,
  // not whatever static item cmdk auto-highlighted first.
  const [highlight, setHighlight] = useState("");

  // Global keyboard shortcut — Cmd+K / Ctrl+K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        useCommandPalette.getState().toggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Reset query when palette opens with a new initial query
  useEffect(() => {
    if (open) setQuery(initialQuery);
  }, [open, initialQuery]);

  // Debounced ticker search
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    const ctrl = new AbortController();
    const handle = setTimeout(() => {
      setSearching(true);
      fetch(`/api/companies/search?q=${encodeURIComponent(query)}`, { signal: ctrl.signal })
        .then((r) => r.json())
        .then((d) => setSuggestions(d.items ?? []))
        .catch(() => {})
        .finally(() => setSearching(false));
    }, 120);
    return () => { ctrl.abort(); clearTimeout(handle); };
  }, [query]);

  // When company suggestions arrive, pin the highlight to the first company
  // so Enter goes to that ticker. When there are no company matches we hand
  // control back to cmdk (value=undefined) so it auto-highlights the best
  // matching page / action instead.
  useEffect(() => {
    if (query.trim() && suggestions.length > 0) {
      setHighlight(`ticker-${suggestions[0].ticker}-${suggestions[0].name}`);
    } else {
      setHighlight("");
    }
  }, [suggestions, query]);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen} value={highlight || undefined} onValueChange={setHighlight}>
      <CommandInput
        placeholder="Search ticker, page, or action…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>{searching ? "Searching…" : "No matches. Try a ticker like RELIANCE or INOXINDIA."}</CommandEmpty>

        {suggestions.length > 0 && (
          <>
            <CommandGroup heading="Companies">
              {suggestions.map((s) => (
                <CommandItem
                  key={s.ticker}
                  value={`ticker-${s.ticker}-${s.name}`}
                  onSelect={() => go(`/research/${s.ticker}`)}
                  className="flex items-center gap-3 px-3 py-2"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/15 text-primary">
                    <TrendingUp className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-mono text-xs font-semibold">{s.ticker}</span>
                    <span className="text-[10px] text-muted-foreground">{s.name}</span>
                  </div>
                  <CommandShortcut>{s.exchange}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
            {query.trim() && !suggestions.some((s) => s.ticker === query.trim().toUpperCase()) && (
              <CommandItem
                value={`go-${query.trim().toUpperCase()}`}
                onSelect={() => go(`/research/${query.trim().toUpperCase()}`)}
                className="flex items-center gap-3 px-3 py-2 text-muted-foreground"
              >
                <Search className="h-4 w-4" />
                Go to{" "}
                <span className="font-mono text-xs font-semibold text-foreground">{query.trim().toUpperCase()}</span>
              </CommandItem>
            )}
            <CommandSeparator />
          </>
        )}

        <CommandGroup heading="Pages">
          {PAGES.map((p) => {
            const Icon = p.icon;
            return (
              <CommandItem
                key={p.href}
                value={`page-${p.label}-${p.keywords}`}
                onSelect={() => go(p.href)}
                className="flex items-center gap-3 px-3 py-2"
              >
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span>{p.label}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Quick actions">
          {QUICK_ACTIONS.map((a) => {
            const Icon = a.icon;
            return (
              <CommandItem
                key={a.label}
                value={`action-${a.label}-${a.keywords}`}
                onSelect={() => go(a.href)}
                className="flex items-center gap-3 px-3 py-2"
              >
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span>{a.label}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

