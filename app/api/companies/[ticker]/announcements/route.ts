import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { marketData } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { ticker: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 25), 100);
  const items = await marketData().getCorporateAnnouncements({
    ticker: params.ticker.toUpperCase(),
    limit,
  });
  return NextResponse.json({ items });
}
