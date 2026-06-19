import { NextResponse } from "next/server";
import { z } from "zod";
import { marketData } from "@/lib/data";
import { runValuationAgent } from "@/lib/ai/agents/valuation-agent";
import { auth } from "@/lib/auth";

const schema = z.object({ ticker: z.string().min(1) });

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const md = marketData();
  const ticker = parsed.data.ticker.toUpperCase();
  const [profile, annual] = await Promise.all([md.getProfile(ticker), md.getAnnualFinancials(ticker, 10)]);
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const out = await runValuationAgent({ profile, annual });
  return NextResponse.json(out);
}
