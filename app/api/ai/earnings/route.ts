import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { runEarningsAgent } from "@/lib/ai/agents/earnings-agent";

const schema = z.object({ documentId: z.string() });

export const maxDuration = 60;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const doc = await prisma.uploadedDocument.findFirst({
    where: { id: parsed.data.documentId, userId: session.user.id },
    include: { company: true },
  });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const out = await runEarningsAgent({
    companyName: doc.company?.name ?? doc.title,
    ticker: doc.company?.ticker ?? "—",
    documentTitle: doc.title,
    documentKind: doc.kind,
    text: doc.text ?? "",
  });

  await prisma.uploadedDocument.update({
    where: { id: doc.id },
    data: { summary: out.summary, metadata: out as any },
  });

  return NextResponse.json(out);
}
