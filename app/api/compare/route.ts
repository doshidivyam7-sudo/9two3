import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { marketData } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const tickers = (url.searchParams.get("tickers") ?? "")
    .split(",")
    .map((t) => t.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 5);

  if (tickers.length < 2) {
    return NextResponse.json({ error: "Need 2-5 tickers" }, { status: 400 });
  }

  const md = marketData();
  const results = await Promise.all(
    tickers.map(async (t) => {
      const [profile, quote, annual, concall] = await Promise.all([
        md.getProfile(t),
        md.getQuote(t),
        md.getAnnualFinancials(t, 10),
        md.getConcallSummary(t),
      ]);
      if (!profile) return null;
      return { ticker: t, profile, quote, annual, concall };
    }),
  );

  const companies = results.filter((r): r is NonNullable<typeof r> => r !== null);
  if (companies.length < 2) {
    return NextResponse.json({ error: "Not enough valid tickers found" }, { status: 404 });
  }

  return NextResponse.json({ companies });
}
