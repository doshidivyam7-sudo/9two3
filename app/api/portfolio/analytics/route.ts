import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { marketData } from "@/lib/data";

export const dynamic = "force-dynamic";

interface EnrichedHolding {
  id: string;
  ticker: string;
  name: string;
  sector: string;
  quantity: number;
  avgCost: number;
  ltp: number;
  value: number;
  cost: number;
  unrealizedPnL: number;
  unrealizedPct: number;
  weight: number; // share of portfolio market value
  pe: number | null;
  roce: number | null;
  revenueCagr: number | null;
  debtToEquity: number | null;
}

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const holdings = await prisma.portfolioHolding.findMany({
    where: { portfolio: { userId: session.user.id } },
    include: { company: true },
    orderBy: { addedAt: "desc" },
  });

  const md = marketData();
  const raw = await Promise.all(
    holdings.map(async (h) => {
      const [quote, profile, annual] = await Promise.all([
        md.getQuote(h.company.ticker),
        md.getProfile(h.company.ticker),
        md.getAnnualFinancials(h.company.ticker, 10),
      ]);
      const ltp = quote?.price ?? 0;
      const value = ltp * h.quantity;
      const cost = h.avgCost * h.quantity;
      const latest = annual[0];
      const oldest = annual[annual.length - 1];
      const years = (latest?.fiscalYear ?? 0) - (oldest?.fiscalYear ?? 0);
      const revenueCagr =
        latest?.revenueCr && oldest?.revenueCr && years > 0
          ? Math.pow(latest.revenueCr / oldest.revenueCr, 1 / years) - 1
          : null;
      return {
        id: h.id,
        ticker: h.company.ticker,
        name: h.company.name,
        sector: profile?.sector ?? "Unclassified",
        quantity: h.quantity,
        avgCost: h.avgCost,
        ltp,
        value,
        cost,
        unrealizedPnL: value - cost,
        unrealizedPct: cost ? (value - cost) / cost : 0,
        pe: latest?.pe ?? null,
        roce: latest?.roce ?? null,
        revenueCagr,
        debtToEquity: latest?.debtToEquity ?? null,
      };
    }),
  );

  const totalValue = raw.reduce((s, h) => s + h.value, 0);
  const totalCost = raw.reduce((s, h) => s + h.cost, 0);

  const enriched: EnrichedHolding[] = raw.map((h) => ({
    ...h,
    weight: totalValue ? h.value / totalValue : 0,
  }));

  // --- Sector allocation -------------------------------------------------
  const sectorMap = new Map<string, number>();
  enriched.forEach((h) => sectorMap.set(h.sector, (sectorMap.get(h.sector) ?? 0) + h.value));
  const sectorAllocation = [...sectorMap.entries()]
    .map(([sector, value]) => ({ sector, value, weight: totalValue ? value / totalValue : 0 }))
    .sort((a, b) => b.value - a.value);

  // --- Concentration -----------------------------------------------------
  const sortedByWeight = [...enriched].sort((a, b) => b.weight - a.weight);
  const top1 = sortedByWeight[0]?.weight ?? 0;
  const top3 = sortedByWeight.slice(0, 3).reduce((s, h) => s + h.weight, 0);
  const top5 = sortedByWeight.slice(0, 5).reduce((s, h) => s + h.weight, 0);
  // Herfindahl-Hirschman Index on weights (0-1; higher = more concentrated)
  const hhi = enriched.reduce((s, h) => s + h.weight * h.weight, 0);
  const effectiveStocks = hhi > 0 ? 1 / hhi : 0;

  // --- Value-weighted fundamentals --------------------------------------
  const weightedAvg = (pick: (h: EnrichedHolding) => number | null) => {
    let num = 0;
    let den = 0;
    enriched.forEach((h) => {
      const v = pick(h);
      if (v !== null && Number.isFinite(v)) {
        num += v * h.value;
        den += h.value;
      }
    });
    return den ? num / den : null;
  };
  const weighted = {
    pe: weightedAvg((h) => h.pe),
    roce: weightedAvg((h) => h.roce),
    revenueCagr: weightedAvg((h) => h.revenueCagr),
    debtToEquity: weightedAvg((h) => h.debtToEquity),
  };

  // --- Best / worst ------------------------------------------------------
  const byReturn = [...enriched].sort((a, b) => b.unrealizedPct - a.unrealizedPct);
  const best = byReturn.slice(0, 3);
  const worst = byReturn.slice(-3).reverse();

  // --- Risk flags --------------------------------------------------------
  const flags: { level: "HIGH" | "MEDIUM" | "LOW"; message: string }[] = [];
  if (top1 > 0.35) flags.push({ level: "HIGH", message: `Single position is ${(top1 * 100).toFixed(0)}% of the book — concentrated single-name risk.` });
  else if (top1 > 0.25) flags.push({ level: "MEDIUM", message: `Largest position is ${(top1 * 100).toFixed(0)}% of the book.` });
  if (top3 > 0.7 && enriched.length > 3) flags.push({ level: "MEDIUM", message: `Top 3 holdings are ${(top3 * 100).toFixed(0)}% of the book.` });
  const topSector = sectorAllocation[0];
  if (topSector && topSector.weight > 0.5 && sectorAllocation.length > 1) flags.push({ level: "MEDIUM", message: `${topSector.sector} is ${(topSector.weight * 100).toFixed(0)}% of the portfolio — sector concentration.` });
  const levered = enriched.filter((h) => (h.debtToEquity ?? 0) > 1);
  const leveredWeight = levered.reduce((s, h) => s + h.weight, 0);
  if (leveredWeight > 0.3) flags.push({ level: "MEDIUM", message: `${(leveredWeight * 100).toFixed(0)}% of the book is in companies with D/E > 1.` });
  if (effectiveStocks > 0 && effectiveStocks < 4 && enriched.length >= 4) flags.push({ level: "LOW", message: `Effective number of stocks is ${effectiveStocks.toFixed(1)} despite ${enriched.length} holdings — diversification is concentrated.` });

  return NextResponse.json({
    summary: {
      totalValue,
      totalCost,
      totalPnL: totalValue - totalCost,
      totalPct: totalCost ? (totalValue - totalCost) / totalCost : 0,
      holdingCount: enriched.length,
    },
    holdings: enriched,
    sectorAllocation,
    concentration: { top1, top3, top5, hhi, effectiveStocks },
    weighted,
    best,
    worst,
    flags,
  });
}
