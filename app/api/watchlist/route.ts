import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { marketData } from "@/lib/data";

const postSchema = z.object({
  ticker: z.string().min(1),
  watchlistName: z.string().optional(),
  targetPrice: z.number().optional(),
  stopPrice: z.number().optional(),
  thesisShort: z.string().optional(),
});

async function ensureWatchlist(userId: string, name = "Default") {
  return prisma.watchlist.upsert({
    where: { userId_name: { userId, name } },
    update: {},
    create: { userId, name },
  });
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const items = await prisma.watchlistItem.findMany({
    where: { watchlist: { userId: session.user.id } },
    include: { company: true, watchlist: true },
    orderBy: { addedAt: "desc" },
  });
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const ticker = parsed.data.ticker.toUpperCase();
  const profile = await marketData().getProfile(ticker);
  if (!profile) return NextResponse.json({ error: "Ticker not found" }, { status: 404 });

  const company = await prisma.company.upsert({
    where: { ticker },
    update: {},
    create: {
      ticker,
      name: profile.name,
      sector: profile.sector,
      industry: profile.industry,
      description: profile.description,
      marketCapCr: profile.marketCapCr,
    },
  });

  const wl = await ensureWatchlist(session.user.id, parsed.data.watchlistName);

  const item = await prisma.watchlistItem.upsert({
    where: { watchlistId_companyId: { watchlistId: wl.id, companyId: company.id } },
    update: {
      targetPrice: parsed.data.targetPrice,
      stopPrice: parsed.data.stopPrice,
      thesisShort: parsed.data.thesisShort,
    },
    create: {
      watchlistId: wl.id,
      companyId: company.id,
      targetPrice: parsed.data.targetPrice,
      stopPrice: parsed.data.stopPrice,
      thesisShort: parsed.data.thesisShort,
    },
  });
  return NextResponse.json({ id: item.id });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await prisma.watchlistItem.deleteMany({
    where: { id, watchlist: { userId: session.user.id } },
  });
  return NextResponse.json({ ok: true });
}
