import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildFullReport } from "@/lib/ai/orchestrator";

const schema = z.object({ ticker: z.string().min(1).max(20) });

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const ticker = parsed.data.ticker.toUpperCase();
  try {
    const result = await buildFullReport(ticker);

    // Persist the report so the dashboard can list it.
    const company = await prisma.company.upsert({
      where: { ticker },
      update: {
        name: result.profile!.name,
        sector: result.profile!.sector,
        industry: result.profile!.industry,
        description: result.profile!.description,
        marketCapCr: result.profile!.marketCapCr,
      },
      create: {
        ticker,
        name: result.profile!.name,
        sector: result.profile!.sector,
        industry: result.profile!.industry,
        description: result.profile!.description,
        marketCapCr: result.profile!.marketCapCr,
      },
    });

    await prisma.researchReport.create({
      data: {
        userId: session.user.id,
        companyId: company.id,
        kind: "FULL_REPORT",
        title: `${ticker} — ${result.report.oneLiner.slice(0, 80)}`,
        summary: result.report.investmentSummary,
        body: result as any,
        snapshot: {
          price: result.quote?.price,
          intrinsicValuePerShare: result.dcf.intrinsicValuePerShare,
          recommendation: result.report.recommendation,
        },
      },
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Report failed" }, { status: 500 });
  }
}
