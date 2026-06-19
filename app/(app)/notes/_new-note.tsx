"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function NewNoteDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", ticker: "", tags: "" });

  async function submit() {
    if (!form.title || !form.body) {
      toast.error("Title and body are required.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        body: form.body,
        ticker: form.ticker || undefined,
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      }),
    });
    setLoading(false);
    if (!res.ok) {
      toast.error("Could not save note.");
      return;
    }
    setOpen(false);
    setForm({ title: "", body: "", ticker: "", tags: "" });
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="h-3.5 w-3.5" /> New note</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New research note</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Title</Label>
            <Input className="mt-1.5" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Ticker (optional)</Label>
              <Input className="mt-1.5" value={form.ticker} onChange={(e) => setForm({ ...form, ticker: e.target.value.toUpperCase() })} />
            </div>
            <div>
              <Label>Tags (comma)</Label>
              <Input className="mt-1.5" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="moat, capex, management" />
            </div>
          </div>
          <div>
            <Label>Body</Label>
            <Textarea className="mt-1.5 min-h-[200px]" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="What you saw, what you think, what to do next." />
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
