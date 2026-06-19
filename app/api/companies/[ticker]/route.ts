import { NextResponse } from "next/server";
import { marketData } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { ticker: string } }) {
  const md = marketData();
  const ticker = params.ticker.toUpperCase();
  const [profile, quote, annual, segments] = await Promise.all([
    md.getProfile(ticker),
    md.getQuote(ticker),
    md.getAnnualFinancials(ticker, 10),
    md.getRevenueSegments(ticker),
  ]);
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ profile, quote, annual, segments });
}
