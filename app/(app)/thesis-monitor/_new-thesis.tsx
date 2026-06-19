"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Indicator {
  indicator: string;
  target: string;
  direction: "UP" | "DOWN" | "STABLE";
}

export function NewThesisDialog({ trigger }: { trigger: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    ticker: "",
    title: "",
    thesis: "",
    bullCase: "",
    baseCase: "",
    bearCase: "",
    targetPrice: "",
    timeHorizonMonths: 36,
    conviction: "MEDIUM" as const,
  });
  const [indicators, setIndicators] = useState<Indicator[]>([
    { indicator: "Revenue growth", target: ">20% YoY", direction: "UP" },
  ]);

  async function submit() {
    if (!form.ticker || !form.title || !form.thesis) {
      toast.error("Ticker, title, and thesis are required.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/thesis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ticker: form.ticker.toUpperCase(),
        title: form.title,
        thesis: form.thesis,
        bullCase: form.bullCase || undefined,
        baseCase: form.baseCase || undefined,
        bearCase: form.bearCase || undefined,
        targetPrice: form.targetPrice ? Number(form.targetPrice) : undefined,
        timeHorizonMonths: Number(form.timeHorizonMonths),
        conviction: form.conviction,
        leadIndicators: indicators.filter((i) => i.indicator && i.target),
      }),
    });
    setLoading(false);
    if (!res.ok) {
      toast.error("Could not save thesis.");
      return;
    }
    setOpen(false);
    toast.success("Thesis saved.");
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record an investment thesis</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>NSE ticker</Label>
              <Input className="mt-1.5" value={form.ticker} onChange={(e) => setForm({ ...form, ticker: e.target.value.toUpperCase() })} placeholder="INOXINDIA" />
            </div>
            <div>
              <Label>Conviction</Label>
              <Select value={form.conviction} onValueChange={(v) => setForm({ ...form, conviction: v as any })}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="VERY_HIGH">Very high</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Title</Label>
            <Input className="mt-1.5" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Cryo capex cycle to drive 25% revenue CAGR" />
          </div>
          <div>
            <Label>Thesis</Label>
            <Textarea className="mt-1.5 min-h-[100px]" value={form.thesis} onChange={(e) => setForm({ ...form, thesis: e.target.value })} placeholder="State what you believe, why it matters, and the magnitude of the opportunity." />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Bull case (optional)</Label>
              <Textarea className="mt-1.5" value={form.bullCase} onChange={(e) => setForm({ ...form, bullCase: e.target.value })} />
            </div>
            <div>
              <Label>Base case (optional)</Label>
              <Textarea className="mt-1.5" value={form.baseCase} onChange={(e) => setForm({ ...form, baseCase: e.target.value })} />
            </div>
            <div>
              <Label>Bear case (optional)</Label>
              <Textarea className="mt-1.5" value={form.bearCase} onChange={(e) => setForm({ ...form, bearCase: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Target price (₹)</Label>
              <Input className="mt-1.5" type="number" value={form.targetPrice} onChange={(e) => setForm({ ...form, targetPrice: e.target.value })} />
            </div>
            <div>
              <Label>Time horizon (months)</Label>
              <Input className="mt-1.5" type="number" value={form.timeHorizonMonths} onChange={(e) => setForm({ ...form, timeHorizonMonths: Number(e.target.value) })} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label>Lead indicators (falsifiable)</Label>
              <Button variant="outline" size="sm" onClick={() => setIndicators([...indicators, { indicator: "", target: "", direction: "UP" }])}>
                <Plus className="h-3 w-3" /> Add
              </Button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Each indicator should be testable from future results or filings.
            </p>
            <div className="mt-2 space-y-2">
              {indicators.map((ind, i) => (
                <div key={i} className="grid grid-cols-12 gap-2">
                  <Input className="col-span-5" placeholder="Indicator (e.g. Order book growth)" value={ind.indicator} onChange={(e) => updateIndicator(i, { indicator: e.target.value })} />
                  <Input className="col-span-4" placeholder="Target (e.g. >25% YoY)" value={ind.target} onChange={(e) => updateIndicator(i, { target: e.target.value })} />
                  <Select value={ind.direction} onValueChange={(v) => updateIndicator(i, { direction: v as any })}>
                    <SelectTrigger className="col-span-2"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UP">Up</SelectItem>
                      <SelectItem value="DOWN">Down</SelectItem>
                      <SelectItem value="STABLE">Stable</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" className="col-span-1" onClick={() => setIndicators(indicators.filter((_, idx) => idx !== i))}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={loading}>
            {loading && <Loader2 className="h-3 w-3 animate-spin" />} Save thesis
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  function updateIndicator(i: number, patch: Partial<Indicator>) {
    setIndicators(indicators.map((ind, idx) => (idx === i ? { ...ind, ...patch } : ind)));
  }
}
