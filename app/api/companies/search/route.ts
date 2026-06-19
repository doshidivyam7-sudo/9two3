import { NextResponse } from "next/server";
import { marketData } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  if (!q.trim()) return NextResponse.json({ items: [] });
  const items = await marketData().searchCompanies(q);
  return NextResponse.json({ items });
}
