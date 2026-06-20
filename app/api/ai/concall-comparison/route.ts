import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { marketData } from "@/lib/data";
import { runConcallComparisonAgent } from "@/lib/ai/agents/concall-comparison-agent";

const schema = z.object({
  ticker: z.string().min(1).max(20),
  // Optional: explicit peer list (UI sends what's currently displayed in Peers tab)
  peerTickers: z.array(z.string()).optional(),
});

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const ticker = parsed.data.ticker.toUpperCase();
  const md = marketData();

  const focal = await md.getConcallSummary(ticker);
  if (!focal) return NextResponse.json({ error: "Concall data not available for this ticker" }, { status: 404 });

  // Resolve peer set — either the one the UI passed in or the provider's default.
  let peerTickers = parsed.data.peerTickers?.map((t) => t.toUpperCase()) ?? [];
  if (peerTickers.length === 0) {
    const peers = await md.getPeers(ticker);
    peerTickers = peers.map((p) => p.ticker.toUpperCase()).filter((t) => t !== ticker);
  }
  // Cap at 6 peers — agent token budget and table width.
  peerTickers = peerTickers.slice(0, 6);

  const peerSummaries = (
    await Promise.all(peerTickers.map((t) => md.getConcallSummary(t)))
  ).filter((s): s is NonNullable<typeof s> => Boolean(s));

  const result = await runConcallComparisonAgent({ focal, peers: peerSummaries });

  return NextResponse.json({
    focal,
    peers: peerSummaries,
    comparison: result,
  });
}
