import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { runScreenerTranslator } from "@/lib/ai/agents/screener-translator";
import { MOCK_UNIVERSE } from "@/lib/data/providers/mock";

const schema = z.object({ prompt: z.string().min(3).max(500) });

export const maxDuration = 30;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const knownSectors = Array.from(new Set(MOCK_UNIVERSE.map((r) => r.sector)));
  const out = await runScreenerTranslator({ prompt: parsed.data.prompt, knownSectors });
  return NextResponse.json(out);
}
