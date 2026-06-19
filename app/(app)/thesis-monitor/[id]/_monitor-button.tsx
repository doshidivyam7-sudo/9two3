"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function MonitorButton({ thesisId }: { thesisId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    const res = await fetch(`/api/thesis/${thesisId}/monitor`, { method: "POST" });
    setLoading(false);
    if (!res.ok) {
      toast.error("Monitor pass failed.");
      return;
    }
    const data = await res.json();
    toast.success(`Verdict: ${data.verdict}`);
    router.refresh();
  }

  return (
    <Button onClick={run} disabled={loading}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
      Run monitor pass
    </Button>
  );
}
