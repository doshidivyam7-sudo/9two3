import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { marketData } from "@/lib/data";
import type { AnnouncementCategory } from "@/lib/data/types";

export const dynamic = "force-dynamic";

const ALLOWED_CATEGORIES: AnnouncementCategory[] = [
  "RESULTS", "DIVIDEND", "BOARD_MEETING", "CAPITAL_RAISE", "ALLOTMENT",
  "MA", "CREDIT_RATING", "INSIDER_TRADE", "CAPEX", "ORDER_WIN",
  "REGULATORY", "MANAGEMENT_CHANGE", "OTHER",
];

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 25), 100);
  const categoryParam = url.searchParams.get("category");
  const category = categoryParam && (ALLOWED_CATEGORIES as string[]).includes(categoryParam)
    ? (categoryParam as AnnouncementCategory)
    : undefined;
  const materialOnly = url.searchParams.get("material") === "1";
  let items = await marketData().getCorporateAnnouncements({ limit, category });
  if (materialOnly) items = items.filter((a) => a.isMaterial);
  return NextResponse.json({ items });
}
