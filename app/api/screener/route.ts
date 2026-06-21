import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import {
  applyFilter,
  applySort,
  BUILTIN_PRESETS,
  getUniverseSnapshot,
  type ScreenerFilter,
  type ScreenerSortKey,
} from "@/lib/data/screener";

export const dynamic = "force-dynamic";

const filterSchema = z.object({
  sectors: z.array(z.string()).optional(),
  industries: z.array(z.string()).optional(),
  marketCapMinCr: z.number().optional(),
  marketCapMaxCr: z.number().optional(),
  roceMinPct: z.number().optional(),
  roeMinPct: z.number().optional(),
  revenueCagrMinPct: z.number().optional(),
  patCagrMinPct: z.number().optional(),
  ebitdaMarginMinPct: z.number().optional(),
  divYieldMinPct: z.number().optional(),
  debtEquityMax: z.number().optional(),
  peMin: z.number().optional(),
  peMax: z.number().optional(),
  evEbitdaMax: z.number().optional(),
  evSalesMax: z.number().optional(),
  pbMax: z.number().optional(),
  search: z.string().optional(),
});

const sortKeys: ScreenerSortKey[] = [
  "marketCapCr", "revenueCr", "patCr", "revenueCagr9y", "patCagr9y",
  "ebitdaMargin", "patMargin", "roce", "roe", "debtToEquity",
  "pe", "evEbitda", "evSales", "pb", "divYield",
];

const bodySchema = z.object({
  filter: filterSchema.optional(),
  sort: z.object({
    key: z.enum(sortKeys as [ScreenerSortKey, ...ScreenerSortKey[]]),
    dir: z.enum(["asc", "desc"]),
  }).optional(),
  limit: z.number().int().positive().max(500).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await getUniverseSnapshot();
  return NextResponse.json({ rows, presets: BUILTIN_PRESETS });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  let rows = await getUniverseSnapshot();
  rows = applyFilter(rows, (parsed.data.filter ?? {}) as ScreenerFilter);
  if (parsed.data.sort) {
    rows = applySort(rows, parsed.data.sort.key, parsed.data.sort.dir);
  }
  if (parsed.data.limit) rows = rows.slice(0, parsed.data.limit);
  return NextResponse.json({ rows, count: rows.length });
}
