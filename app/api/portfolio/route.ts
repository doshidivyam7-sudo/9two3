import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { marketData } from "@/lib/data";

const postSchema = z.object({
  ticker: z.string().min(1),
  quantity: z.number().positive(),
  avgCost: z.number().positive(),
  notes: z.string().optional(),
  portfolioName: z.string().optional(),
});

async function ensurePortfolio(userId: string, name = "Core") {
  return prisma.portfolio.upsert({
    where: { userId_name: { userId, name } },
    update: {},
    create: { userId, name },
  });
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const holdings = await prisma.portfolioHolding.findMany({
    where: { portfolio: { userId: session.user.id } },
    include: { company: true, portfolio: true },
    orderBy: { addedAt: "desc" },
  });
  // Enrich with live price for unrealized P&L
  const md = marketData();
  const enriched = await Promise.all(
    holdings.map(async (h) => {
      const q = await md.getQuote(h.company.ticker);
      const ltp = q?.price ?? 0;
      const value = ltp * h.quantity;
      const cost = h.avgCost * h.quantity;
      return {
        id: h.id,
        ticker: h.company.ticker,
        name: h.company.name,
        quantity: h.quantity,
        avgCost: h.avgCost,
        ltp,
        value,
        cost,
        unrealizedPnL: value - cost,
        unrealizedPct: cost ? (value - cost) / cost : 0,
        notes: h.notes,
      };
    }),
  );
  return NextResponse.json({ holdings: enriched });
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
    create: { ticker, name: profile.name, sector: profile.sector, industry: profile.industry },
  });
  const portfolio = await ensurePortfolio(session.user.id, parsed.data.portfolioName);
  const h = await prisma.portfolioHolding.upsert({
    where: { portfolioId_companyId: { portfolioId: portfolio.id, companyId: company.id } },
    update: {
      quantity: parsed.data.quantity,
      avgCost: parsed.data.avgCost,
      notes: parsed.data.notes,
    },
    create: {
      portfolioId: portfolio.id,
      companyId: company.id,
      quantity: parsed.data.quantity,
      avgCost: parsed.data.avgCost,
      notes: parsed.data.notes,
    },
  });
  return NextResponse.json({ id: h.id });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await prisma.portfolioHolding.deleteMany({
    where: { id, portfolio: { userId: session.user.id } },
  });
  return NextResponse.json({ ok: true });
}
