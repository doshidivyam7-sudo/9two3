"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function AddHoldingDialog({ trigger }: { trigger: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ ticker: "", quantity: "", avgCost: "", notes: "" });

  async function submit() {
    if (!form.ticker || !form.quantity || !form.avgCost) {
      toast.error("Ticker, quantity, and avg cost are required.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/portfolio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ticker: form.ticker.toUpperCase(),
        quantity: Number(form.quantity),
        avgCost: Number(form.avgCost),
        notes: form.notes || undefined,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      toast.error("Could not add holding.");
      return;
    }
    setOpen(false);
    toast.success("Holding added.");
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add holding</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>NSE ticker</Label>
            <Input className="mt-1.5" value={form.ticker} onChange={(e) => setForm({ ...form, ticker: e.target.value.toUpperCase() })} placeholder="HUDCO" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Quantity</Label>
              <Input className="mt-1.5" type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
            </div>
            <div>
              <Label>Avg cost (₹)</Label>
              <Input className="mt-1.5" type="number" value={form.avgCost} onChange={(e) => setForm({ ...form, avgCost: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea className="mt-1.5" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Why you own it. Position sizing rationale." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={loading}>
            {loading && <Loader2 className="h-3 w-3 animate-spin" />} Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
