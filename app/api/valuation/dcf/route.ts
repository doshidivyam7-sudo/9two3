import { NextResponse } from "next/server";
import { z } from "zod";
import { runDCF } from "@/lib/valuation/dcf";

const schema = z.object({
  assumptions: z.object({
    baseRevenueCr: z.number().positive(),
    revenueGrowth: z.array(z.number()).min(1).max(20),
    ebitdaMargin: z.union([z.number(), z.array(z.number())]),
    daPctOfRevenue: z.number().min(0).max(0.5),
    taxRate: z.number().min(0).max(0.5),
    capexPctOfRevenue: z.number().min(0).max(0.5),
    workingCapitalPctOfIncRev: z.number().min(-0.5).max(0.5),
    wacc: z.number().min(0.01).max(0.4),
    terminalGrowth: z.number().min(-0.1).max(0.1),
    netDebtCr: z.number(),
    sharesOutstandingCr: z.number().positive(),
    minorityInterestCr: z.number().optional(),
  }),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  try {
    const result = runDCF(parsed.data.assumptions);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
