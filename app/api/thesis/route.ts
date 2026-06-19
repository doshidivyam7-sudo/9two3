import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { marketData } from "@/lib/data";

const leadIndicatorSchema = z.object({
  indicator: z.string().min(1),
  target: z.string().min(1),
  direction: z.enum(["UP", "DOWN", "STABLE"]),
});

const postSchema = z.object({
  ticker: z.string().min(1),
  title: z.string().min(1).max(200),
  thesis: z.string().min(10),
  leadIndicators: z.array(leadIndicatorSchema).min(1),
  bullCase: z.string().optional(),
  baseCase: z.string().optional(),
  bearCase: z.string().optional(),
  targetPrice: z.number().optional(),
  stopLoss: z.number().optional(),
  timeHorizonMonths: z.number().int().positive().default(36),
  conviction: z.enum(["LOW", "MEDIUM", "HIGH", "VERY_HIGH"]).default("MEDIUM"),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const items = await prisma.investmentThesis.findMany({
    where: { userId: session.user.id },
    include: { company: true, checks: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

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
    },
  });

  const thesis = await prisma.investmentThesis.create({
    data: {
      userId: session.user.id,
      companyId: company.id,
      title: parsed.data.title,
      thesis: parsed.data.thesis,
      leadIndicators: parsed.data.leadIndicators,
      bullCase: parsed.data.bullCase,
      baseCase: parsed.data.baseCase,
      bearCase: parsed.data.bearCase,
      targetPrice: parsed.data.targetPrice,
      stopLoss: parsed.data.stopLoss,
      timeHorizonMonths: parsed.data.timeHorizonMonths,
      conviction: parsed.data.conviction,
    },
  });
  return NextResponse.json({ id: thesis.id });
}
