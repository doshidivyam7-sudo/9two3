"use client";

import { useEffect, useState } from "react";
import { Upload, FileText, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { fmtDate } from "@/lib/format";

interface Doc {
  id: string;
  title: string;
  fileName: string;
  kind: string;
  createdAt: string;
  summary?: string | null;
}

export function DocumentsSection({ ticker }: { ticker: string }) {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(false);
  const [extraction, setExtraction] = useState<any>(null);
  const [extracting, setExtracting] = useState(false);

  async function load() {
    const res = await fetch(`/api/documents?ticker=${ticker}`);
    if (res.ok) setDocs((await res.json()).items ?? []);
  }
  useEffect(() => {
    load();
  }, [ticker]);

  async function upload(file: File) {
    setLoading(true);
    const fd = new FormData();
    fd.set("file", file);
    fd.set("ticker", ticker);
    const res = await fetch("/api/documents/upload", { method: "POST", body: fd });
    setLoading(false);
    if (!res.ok) {
      toast.error("Could not upload document.");
      return;
    }
    toast.success("Document uploaded.");
    await load();
  }

  async function extract(docId: string) {
    setExtracting(true);
    setExtraction(null);
    const res = await fetch(`/api/ai/earnings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId: docId }),
    });
    setExtracting(false);
    if (res.ok) {
      setExtraction(await res.json());
    } else {
      toast.error("Extraction failed.");
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><FileText className="h-3.5 w-3.5" /> Documents</CardTitle>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border bg-background/40 px-3 py-1.5 text-xs hover:border-foreground/30">
            <Upload className="h-3.5 w-3.5" />
            {loading ? "Uploading…" : "Upload PDF / transcript"}
            <input
              type="file"
              accept=".pdf,.txt"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
            />
          </label>
        </CardHeader>
        <CardContent>
          {docs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Upload an annual report, concall transcript, or investor presentation. The Earnings agent will extract guidance, capex, risks, and red flags.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {docs.map((d) => (
                <li key={d.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div>
                    <div className="text-sm font-medium">{d.title}</div>
                    <div className="text-xs text-muted-foreground">{d.fileName} · {fmtDate(d.createdAt)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{d.kind.replace("_", " ").toLowerCase()}</Badge>
                    <Button size="sm" variant="outline" onClick={() => extract(d.id)} disabled={extracting}>
                      {extracting && <Loader2 className="h-3 w-3 animate-spin" />} Extract
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {extraction && (
        <Card>
          <CardHeader>
            <CardTitle>Earnings agent extraction</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <Badge variant={extraction.overallTone === "POSITIVE" ? "bull" : extraction.overallTone === "NEGATIVE" ? "bear" : "warn"}>
              Tone: {extraction.overallTone}
            </Badge>
            <p>{extraction.summary}</p>

            {extraction.guidance?.length > 0 && (
              <div>
                <Label>Guidance</Label>
                <table className="mt-1 w-full text-xs">
                  <thead className="border-b border-border text-[10px] uppercase tracking-widest text-muted-foreground">
                    <tr>
                      <th className="px-2 py-1 text-left">Metric</th>
                      <th className="px-2 py-1 text-left">Value</th>
                      <th className="px-2 py-1 text-left">Horizon</th>
                      <th className="px-2 py-1 text-left">Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {extraction.guidance.map((g: any, i: number) => (
                      <tr key={i} className="border-b border-border/60 last:border-b-0">
                        <td className="px-2 py-1">{g.metric}</td>
                        <td className="px-2 py-1 font-medium">{g.value}</td>
                        <td className="px-2 py-1 text-muted-foreground">{g.horizon}</td>
                        <td className="px-2 py-1">{g.confidence}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <Bullets label="Growth drivers" items={extraction.growthDrivers} />
              <Bullets label="Margin commentary" items={extraction.marginCommentary} />
              <Bullets label="Capital allocation" items={extraction.capitalAllocation} />
              <Bullets label="Future capex" items={extraction.futureCapex} />
              <Bullets label="Risks" items={extraction.risks} />
              <div>
                <Label>Red flags</Label>
                <ul className="mt-1 space-y-1">
                  {(extraction.redFlags ?? []).map((r: any, i: number) => (
                    <li key={i} className="rounded border border-border bg-background/40 p-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{r.flag}</span>
                        <Badge variant={r.severity === "HIGH" ? "bear" : r.severity === "MEDIUM" ? "warn" : "outline"}>{r.severity}</Badge>
                      </div>
                      {r.quote && <p className="mt-1 italic text-muted-foreground">"{r.quote}"</p>}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Bullets({ label, items }: { label: string; items?: string[] }) {
  return (
    <div>
      <Label>{label}</Label>
      {!items || items.length === 0 ? (
        <p className="mt-1 text-xs text-muted-foreground">—</p>
      ) : (
        <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs">
          {items.map((it, i) => <li key={i}>{it}</li>)}
        </ul>
      )}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{children}</div>;
}
