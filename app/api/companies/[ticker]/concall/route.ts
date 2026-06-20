import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { marketData } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { ticker: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const summary = await marketData().getConcallSummary(params.ticker.toUpperCase());
  if (!summary) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(summary);
}
