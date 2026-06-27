"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Loader2, Sparkles, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
}

const QUICK_PROMPTS = [
  "Summarise the bull and bear case in 3 lines each.",
  "How has ROCE trended over the last 10 years?",
  "Is the current valuation cheap or expensive vs peers?",
  "What did management guide for next year?",
  "What are the key risks to the thesis?",
];

export function ChatSection({ ticker }: { ticker: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load any prior conversation for this ticker.
  useEffect(() => {
    let live = true;
    fetch(`/api/ai/chat?ticker=${ticker}`)
      .then((r) => r.json())
      .then((d) => {
        if (!live || !d.conversation) return;
        setConversationId(d.conversation.id);
        setMessages(
          (d.conversation.messages ?? []).map((m: any) => ({
            role: m.role,
            content: m.content,
            sources: m.toolCalls?.sources,
          })),
        );
      });
    return () => { live = false; };
  }, [ticker]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(question: string) {
    const q = question.trim();
    if (!q || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: q }]);
    setLoading(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker, question: q, conversationId }),
      });
      if (!res.ok) {
        setMessages((m) => [...m, { role: "assistant", content: "Sorry — that request failed. Try again." }]);
        return;
      }
      const data = await res.json();
      setConversationId(data.conversationId);
      setMessages((m) => [...m, { role: "assistant", content: data.answer, sources: data.sources }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="flex flex-col" style={{ height: "min(72vh, 760px)" }}>
      <CardHeader className="flex flex-row items-center justify-between border-b border-border">
        <CardTitle className="flex items-center gap-2"><Sparkles className="h-3.5 w-3.5" /> Company Copilot · {ticker}</CardTitle>
        <Badge variant="outline" className="text-[9px]">grounded in this company's data</Badge>
      </CardHeader>

      <CardContent ref={scrollRef as any} className="flex-1 space-y-4 overflow-y-auto p-5">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <Sparkles className="h-6 w-6 text-primary" />
            <div>
              <div className="text-sm font-semibold">Ask anything about {ticker}</div>
              <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                Grounded in this company's 10-year financials, valuation, peers, concall guidance,
                announcements and news. Answers cite the data they used.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => send(p)}
                  className="rounded-full border border-border bg-background/40 px-3 py-1.5 text-xs text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={cn("flex gap-3", m.role === "user" && "flex-row-reverse")}>
            <div className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
              m.role === "user" ? "bg-secondary" : "bg-primary/15 text-primary",
            )}>
              {m.role === "user" ? <User className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
            </div>
            <div className={cn("max-w-[80%] space-y-2", m.role === "user" && "items-end")}>
              <div className={cn(
                "rounded-lg px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
                m.role === "user" ? "bg-secondary" : "border border-border bg-background/40",
              )}>
                {m.content}
              </div>
              {m.sources && m.sources.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {m.sources.map((s) => <Badge key={s} variant="info" className="text-[9px]">{s}</Badge>)}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-background/40 px-3.5 py-2.5 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…
            </div>
          </div>
        )}
      </CardContent>

      <div className="border-t border-border p-3">
        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder={`Ask about ${ticker}… (Enter to send, Shift+Enter for newline)`}
            className="min-h-[44px] max-h-32 resize-none"
          />
          <Button onClick={() => send(input)} disabled={loading || !input.trim()} size="icon" className="h-11 w-11 shrink-0">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </Card>
  );
}
