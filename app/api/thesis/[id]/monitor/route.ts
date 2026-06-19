import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { marketData } from "@/lib/data";
import { runThesisAgent } from "@/lib/ai/agents/thesis-agent";

export const maxDuration = 60;

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const thesis = await prisma.investmentThesis.findFirst({
    where: { id: params.id, userId: session.user.id },
    include: { company: true },
  });
  if (!thesis) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const md = marketData();
  const [annual, news, docs] = await Promise.all([
    md.getAnnualFinancials(thesis.company.ticker, 5),
    md.getNews(thesis.company.ticker, 20),
    prisma.uploadedDocument.findMany({
      where: { userId: session.user.id, companyId: thesis.companyId },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);

  const result = await runThesisAgent({
    ticker: thesis.company.ticker,
    companyName: thesis.company.name,
    thesis: thesis.thesis,
    leadIndicators: thesis.leadIndicators as any,
    bullCase: thesis.bullCase ?? undefined,
    baseCase: thesis.baseCase ?? undefined,
    bearCase: thesis.bearCase ?? undefined,
    recentAnnual: annual,
    recentNews: news,
    documentSnippets: docs.map((d) => ({ title: d.title, snippet: (d.text ?? "").slice(0, 3000) })),
  });

  const newStatus =
    result.verdict === "STRENGTHENED"
      ? "STRENGTHENED"
      : result.verdict === "WEAKENED"
      ? "WEAKENED"
      : result.verdict === "BROKEN"
      ? "BROKEN"
      : "ACTIVE";

  await prisma.$transaction([
    prisma.thesisCheck.create({
      data: {
        thesisId: thesis.id,
        verdict: result.verdict as any,
        score: result.score,
        reasoning: result.reasoning,
        evidence: result as any,
      },
    }),
    prisma.investmentThesis.update({
      where: { id: thesis.id },
      data: { lastMonitoredAt: new Date(), status: newStatus as any },
    }),
  ]);

  return NextResponse.json(result);
}
