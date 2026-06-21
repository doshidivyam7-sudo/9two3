"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Loader2, RotateCcw, Sparkles, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fmtCr, fmtNum, fmtPctValue } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type ScreenerRow = {
  ticker: string; name: string; sector: string; industry: string;
  marketCapCr: number; price: number; revenueCr: number; ebitdaCr: number; patCr: number;
  ebitdaMargin: number; patMargin: number; roce: number; roe: number; debtToEquity: number;
  pe: number; evEbitda: number; evSales: number; pb: number; dividendYield: number;
  revenueCagr9y: number | null; patCagr9y: number | null;
};

type SortKey =
  | "marketCapCr" | "revenueCr" | "patCr" | "revenueCagr9y" | "patCagr9y"
  | "ebitdaMargin" | "roce" | "roe" | "debtToEquity" | "pe" | "evEbitda";

interface Preset {
  id: string; name: string; description: string;
  filter: any; sort: { key: SortKey; dir: "asc" | "desc" };
}

interface Filter {
  sectors?: string[];
  marketCapMinCr?: number; marketCapMaxCr?: number;
  roceMinPct?: number; roeMinPct?: number;
  revenueCagrMinPct?: number;
  ebitdaMarginMinPct?: number;
  divYieldMinPct?: number;
  debtEquityMax?: number;
  peMax?: number; evEbitdaMax?: number;
  search?: string;
}

const DEFAULT_FILTER: Filter = {};
const DEFAULT_SORT: { key: SortKey; dir: "asc" | "desc" } = { key: "marketCapCr", dir: "desc" };

export function ScreenerView() {
  const [universe, setUniverse] = useState<ScreenerRow[]>([]);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [rows, setRows] = useState<ScreenerRow[]>([]);
  const [filter, setFilter] = useState<Filter>(DEFAULT_FILTER);
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>(DEFAULT_SORT);
  const [loading, setLoading] = useState(true);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRationale, setAiRationale] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Load universe + presets on mount
  useEffect(() => {
    let live = true;
    fetch("/api/screener")
      .then((r) => r.json())
      .then((d) => {
        if (!live) return;
        setUniverse(d.rows ?? []);
        setPresets(d.presets ?? []);
        setLoading(false);
      });
    return () => { live = false; };
  }, []);

  // Apply filter + sort whenever they change
  useEffect(() => {
    if (universe.length === 0) return;
    fetch("/api/screener", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filter, sort }),
    })
      .then((r) => r.json())
      .then((d) => setRows(d.rows ?? []));
  }, [universe, filter, sort]);

  const sectors = useMemo(() => Array.from(new Set(universe.map((r) => r.sector))).sort(), [universe]);

  async function applyPreset(p: Preset) {
    setFilter(p.filter);
    setSort(p.sort);
    setAiRationale(null);
    toast.success(`Applied: ${p.name}`);
  }

  async function runAi() {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    const res = await fetch("/api/ai/screener", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: aiPrompt }),
    });
    setAiLoading(false);
    if (!res.ok) {
      toast.error("Could not translate prompt.");
      return;
    }
    const data = await res.json();
    setFilter(data.filter ?? {});
    if (data.sort) setSort(data.sort);
    setAiRationale(data.rationale);
  }

  function reset() {
    setFilter(DEFAULT_FILTER);
    setSort(DEFAULT_SORT);
    setAiRationale(null);
    setAiPrompt("");
  }

  function toggleSort(key: SortKey) {
    setSort((s) => s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" });
  }

  async function addSelectedToWatchlist() {
    if (selected.size === 0) return;
    const tickers = Array.from(selected);
    const results = await Promise.all(
      tickers.map((t) =>
        fetch("/api/watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticker: t }),
        }).then((r) => r.ok),
      ),
    );
    const ok = results.filter(Boolean).length;
    toast.success(`Added ${ok}/${tickers.length} to watchlist`);
    setSelected(new Set());
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <FilterSidebar
        filter={filter}
        setFilter={setFilter}
        sectors={sectors}
        presets={presets}
        applyPreset={applyPreset}
        aiPrompt={aiPrompt}
        setAiPrompt={setAiPrompt}
        runAi={runAi}
        aiLoading={aiLoading}
        aiRationale={aiRationale}
        reset={reset}
      />

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle>{loading ? "Loading universe…" : `${rows.length} result${rows.length === 1 ? "" : "s"}`}</CardTitle>
          {selected.size > 0 && (
            <Button size="sm" onClick={addSelectedToWatchlist}>
              <Star className="h-3.5 w-3.5" /> Add {selected.size} to watchlist
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y border-border text-[10px] uppercase tracking-widest text-muted-foreground">
                <th className="px-3 py-2 text-left font-medium w-8"></th>
                <th className="px-4 py-2 text-left font-medium">Ticker</th>
                <th className="px-4 py-2 text-left font-medium">Sector</th>
                <Th label="Mkt Cap" k="marketCapCr" sort={sort} toggle={toggleSort} />
                <Th label="Revenue" k="revenueCr" sort={sort} toggle={toggleSort} />
                <Th label="Rev CAGR" k="revenueCagr9y" sort={sort} toggle={toggleSort} />
                <Th label="EBITDA mgn" k="ebitdaMargin" sort={sort} toggle={toggleSort} />
                <Th label="ROCE" k="roce" sort={sort} toggle={toggleSort} />
                <Th label="D/E" k="debtToEquity" sort={sort} toggle={toggleSort} />
                <Th label="PE" k="pe" sort={sort} toggle={toggleSort} />
                <Th label="EV/EBITDA" k="evEbitda" sort={sort} toggle={toggleSort} />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.ticker} className="border-b border-border/60 last:border-b-0 hover:bg-accent/30">
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selected.has(r.ticker)}
                      onChange={(e) => {
                        const next = new Set(selected);
                        if (e.target.checked) next.add(r.ticker); else next.delete(r.ticker);
                        setSelected(next);
                      }}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <Link href={`/research/${r.ticker}`} className="font-mono text-xs font-semibold hover:underline">{r.ticker}</Link>
                    <div className="text-[10px] text-muted-foreground truncate max-w-[180px]">{r.name}</div>
                  </td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">
                    <div>{r.sector}</div>
                    <div className="text-[10px]">{r.industry}</div>
                  </td>
                  <td className="px-4 py-2 text-right num">{fmtCr(r.marketCapCr, "")}</td>
                  <td className="px-4 py-2 text-right num">{fmtCr(r.revenueCr, "")}</td>
                  <td className={cn("px-4 py-2 text-right num", (r.revenueCagr9y ?? 0) >= 0.15 && "stat-bull")}>
                    {r.revenueCagr9y !== null ? fmtPctValue(r.revenueCagr9y * 100) : "—"}
                  </td>
                  <td className="px-4 py-2 text-right num">{fmtPctValue(r.ebitdaMargin * 100)}</td>
                  <td className={cn("px-4 py-2 text-right num", r.roce >= 0.20 && "stat-bull")}>{fmtPctValue(r.roce * 100)}</td>
                  <td className={cn("px-4 py-2 text-right num", r.debtToEquity > 1 && "stat-bear")}>{fmtNum(r.debtToEquity, 2)}</td>
                  <td className="px-4 py-2 text-right num">{fmtNum(r.pe, 1)}x</td>
                  <td className="px-4 py-2 text-right num">{fmtNum(r.evEbitda, 1)}x</td>
                </tr>
              ))}
              {!loading && rows.length === 0 && (
                <tr><td colSpan={11} className="p-8 text-center text-sm text-muted-foreground">No companies match the current filter.</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function Th({ label, k, sort, toggle }: { label: string; k: SortKey; sort: { key: SortKey; dir: "asc" | "desc" }; toggle: (k: SortKey) => void }) {
  const active = sort.key === k;
  return (
    <th
      onClick={() => toggle(k)}
      className={cn(
        "px-4 py-2 text-right font-medium cursor-pointer select-none whitespace-nowrap",
        active && "text-foreground",
      )}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active && (sort.dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
      </span>
    </th>
  );
}

function FilterSidebar({
  filter, setFilter, sectors, presets, applyPreset, aiPrompt, setAiPrompt, runAi, aiLoading, aiRationale, reset,
}: {
  filter: Filter;
  setFilter: (f: Filter) => void;
  sectors: string[];
  presets: Preset[];
  applyPreset: (p: Preset) => void;
  aiPrompt: string;
  setAiPrompt: (s: string) => void;
  runAi: () => void;
  aiLoading: boolean;
  aiRationale: string | null;
  reset: () => void;
}) {
  function patch(p: Partial<Filter>) { setFilter({ ...filter, ...p }); }
  return (
    <div className="space-y-4">
      {/* AI prompt */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Sparkles className="h-3.5 w-3.5" /> Ask the screener</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Input
            placeholder="e.g. quality compounders with ROCE above 25%"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runAi()}
          />
          <Button size="sm" className="w-full" onClick={runAi} disabled={aiLoading || !aiPrompt.trim()}>
            {aiLoading && <Loader2 className="h-3 w-3 animate-spin" />} Translate to filter
          </Button>
          {aiRationale && (
            <p className="rounded border border-border bg-background/40 p-2 text-xs text-muted-foreground">{aiRationale}</p>
          )}
        </CardContent>
      </Card>

      {/* Presets */}
      <Card>
        <CardHeader><CardTitle>Presets</CardTitle></CardHeader>
        <CardContent className="space-y-1.5">
          {presets.map((p) => (
            <button
              key={p.id}
              onClick={() => applyPreset(p)}
              className="block w-full rounded border border-border bg-background/40 p-2.5 text-left hover:border-foreground/30"
            >
              <div className="text-sm font-medium">{p.name}</div>
              <div className="text-[11px] text-muted-foreground">{p.description}</div>
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Manual filters */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Filters</CardTitle>
          <button onClick={reset} className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground">
            <RotateCcw className="inline h-3 w-3" /> Reset
          </button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Sector</Label>
            <Select
              value={filter.sectors?.[0] ?? "ALL"}
              onValueChange={(v) => patch({ sectors: v === "ALL" ? undefined : [v] })}
            >
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All sectors</SelectItem>
                {sectors.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <RangeNum
            label="Market cap (₹ Cr)"
            min={filter.marketCapMinCr}
            max={filter.marketCapMaxCr}
            onMin={(v) => patch({ marketCapMinCr: v })}
            onMax={(v) => patch({ marketCapMaxCr: v })}
          />
          <PctSlider
            label="ROCE min"
            value={filter.roceMinPct}
            onChange={(v) => patch({ roceMinPct: v })}
            min={0} max={50}
          />
          <PctSlider
            label="ROE min"
            value={filter.roeMinPct}
            onChange={(v) => patch({ roeMinPct: v })}
            min={0} max={40}
          />
          <PctSlider
            label="Revenue CAGR min (9y)"
            value={filter.revenueCagrMinPct}
            onChange={(v) => patch({ revenueCagrMinPct: v })}
            min={0} max={40}
          />
          <PctSlider
            label="EBITDA margin min"
            value={filter.ebitdaMarginMinPct}
            onChange={(v) => patch({ ebitdaMarginMinPct: v })}
            min={0} max={60}
          />
          <NumberInput
            label="Debt / Equity max"
            value={filter.debtEquityMax}
            step={0.1}
            onChange={(v) => patch({ debtEquityMax: v })}
          />
          <NumberInput
            label="PE max"
            value={filter.peMax}
            step={1}
            onChange={(v) => patch({ peMax: v })}
          />
          <NumberInput
            label="EV/EBITDA max"
            value={filter.evEbitdaMax}
            step={0.5}
            onChange={(v) => patch({ evEbitdaMax: v })}
          />
          <PctSlider
            label="Dividend yield min"
            value={filter.divYieldMinPct}
            onChange={(v) => patch({ divYieldMinPct: v })}
            min={0} max={6}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function PctSlider({ label, value, min, max, onChange }: { label: string; value: number | undefined; min: number; max: number; onChange: (v: number | undefined) => void }) {
  const v = value ?? 0;
  return (
    <div>
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs tabular-nums text-muted-foreground">{v.toFixed(0)}%</span>
          {value !== undefined && (
            <button onClick={() => onChange(undefined)} className="text-[10px] text-muted-foreground hover:text-foreground">×</button>
          )}
        </div>
      </div>
      <Slider
        className="mt-2"
        value={[v]}
        min={min} max={max} step={1}
        onValueChange={(arr) => onChange(arr[0] === 0 ? undefined : arr[0])}
      />
    </div>
  );
}

function NumberInput({ label, value, step, onChange }: { label: string; value: number | undefined; step: number; onChange: (v: number | undefined) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        {value !== undefined && (
          <button onClick={() => onChange(undefined)} className="text-[10px] text-muted-foreground hover:text-foreground">clear</button>
        )}
      </div>
      <Input
        type="number"
        className="mt-1.5"
        step={step}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
      />
    </div>
  );
}

function RangeNum({ label, min, max, onMin, onMax }: { label: string; min: number | undefined; max: number | undefined; onMin: (v: number | undefined) => void; onMax: (v: number | undefined) => void }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-1.5 grid grid-cols-2 gap-2">
        <Input type="number" placeholder="Min" value={min ?? ""} onChange={(e) => onMin(e.target.value ? Number(e.target.value) : undefined)} />
        <Input type="number" placeholder="Max" value={max ?? ""} onChange={(e) => onMax(e.target.value ? Number(e.target.value) : undefined)} />
      </div>
    </div>
  );
}
