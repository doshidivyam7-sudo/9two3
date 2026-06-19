import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { marketData } from "@/lib/data";

export const runtime = "nodejs";
export const maxDuration = 60;

function guessKind(filename: string): "ANNUAL_REPORT" | "CONCALL_TRANSCRIPT" | "INVESTOR_PRESENTATION" | "EARNINGS_RELEASE" | "OTHER" {
  const f = filename.toLowerCase();
  if (f.includes("annual") || f.includes("ar2") || f.includes("ar20")) return "ANNUAL_REPORT";
  if (f.includes("concall") || f.includes("transcript") || f.includes("call")) return "CONCALL_TRANSCRIPT";
  if (f.includes("ppt") || f.includes("presentation") || f.includes("deck")) return "INVESTOR_PRESENTATION";
  if (f.includes("earnings") || f.includes("results")) return "EARNINGS_RELEASE";
  return "OTHER";
}

async function extractText(file: File): Promise<string> {
  const arrayBuf = await file.arrayBuffer();
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    // Dynamic import — pdf-parse pulls in optional native deps lazily
    const pdf = (await import("pdf-parse")).default;
    const data = await pdf(Buffer.from(arrayBuf));
    return data.text;
  }
  // Plain text fallback
  return Buffer.from(arrayBuf).toString("utf-8");
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const ticker = (form.get("ticker") as string | null)?.toUpperCase() ?? null;
  if (!file) return NextResponse.json({ error: "Missing file" }, { status: 400 });
  if (file.size > 20 * 1024 * 1024) return NextResponse.json({ error: "File > 20MB" }, { status: 413 });

  let text = "";
  try {
    text = await extractText(file);
  } catch (err) {
    return NextResponse.json({ error: "Could not extract text from document." }, { status: 400 });
  }

  let companyId: string | undefined;
  if (ticker) {
    const profile = await marketData().getProfile(ticker);
    const c = await prisma.company.upsert({
      where: { ticker },
      update: {},
      create: {
        ticker,
        name: profile?.name ?? ticker,
        sector: profile?.sector,
        industry: profile?.industry,
        description: profile?.description,
      },
    });
    companyId = c.id;
  }

  const doc = await prisma.uploadedDocument.create({
    data: {
      userId: session.user.id,
      companyId,
      kind: guessKind(file.name),
      title: file.name.replace(/\.[^/.]+$/, ""),
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || "application/octet-stream",
      text: text.slice(0, 1_500_000),
    },
  });

  return NextResponse.json({ id: doc.id });
}
