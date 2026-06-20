import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { runAnnouncementSummariser } from "@/lib/ai/agents/announcement-summarizer";

const schema = z.object({
  text: z.string().min(20).max(50_000),
  ticker: z.string().optional(),
  companyName: z.string().optional(),
  filingTitle: z.string().optional(),
});

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const out = await runAnnouncementSummariser(parsed.data);
  return NextResponse.json(out);
}
