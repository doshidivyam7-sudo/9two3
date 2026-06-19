"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function PreferencesForm({ prefs }: { prefs: any }) {
  const [llm, setLlm] = useState(prefs.llmProvider as string);
  const [exch, setExch] = useState(prefs.defaultExchange as string);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    const res = await fetch("/api/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ llmProvider: llm, defaultExchange: exch }),
    });
    setLoading(false);
    if (!res.ok) toast.error("Could not save preferences.");
    else toast.success("Preferences saved.");
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>Default LLM provider</Label>
        <Select value={llm} onValueChange={setLlm}>
          <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="anthropic">Anthropic Claude</SelectItem>
            <SelectItem value="openai">OpenAI GPT</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Default exchange</Label>
        <Select value={exch} onValueChange={setExch}>
          <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="NSE">NSE</SelectItem>
            <SelectItem value="BSE">BSE</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button onClick={save} disabled={loading}>Save preferences</Button>
    </div>
  );
}
