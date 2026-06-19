import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const postSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1),
  ticker: z.string().optional(),
  tags: z.array(z.string()).optional(),
  pinned: z.boolean().optional(),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const ticker = url.searchParams.get("ticker")?.toUpperCase();
  const items = await prisma.researchNote.findMany({
    where: { userId: session.user.id, ...(ticker ? { ticker } : {}) },
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
  });
  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const note = await prisma.researchNote.create({
    data: {
      userId: session.user.id,
      ticker: parsed.data.ticker?.toUpperCase(),
      title: parsed.data.title,
      body: parsed.data.body,
      tags: parsed.data.tags ?? [],
      pinned: parsed.data.pinned ?? false,
    },
  });
  return NextResponse.json({ id: note.id });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await prisma.researchNote.deleteMany({ where: { id, userId: session.user.id } });
  return NextResponse.json({ ok: true });
}
