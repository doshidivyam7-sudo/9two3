import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { marketData } from "@/lib/data";
import { runCompanyChat, type ChatTurn } from "@/lib/ai/agents/company-chat-agent";

const schema = z.object({
  ticker: z.string().min(1).max(20),
  question: z.string().min(1).max(2000),
  // Client may send null before a conversation exists — accept null/undefined.
  conversationId: z.string().nullish(),
});

export const runtime = "nodejs";
export const maxDuration = 45;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const ticker = parsed.data.ticker.toUpperCase();
  const md = marketData();

  // Resolve / create the conversation.
  let conversation = parsed.data.conversationId
    ? await prisma.aIConversation.findFirst({
        where: { id: parsed.data.conversationId, userId: session.user.id },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      })
    : null;

  if (!conversation) {
    conversation = await prisma.aIConversation.create({
      data: {
        userId: session.user.id,
        ticker,
        agent: "company-chat",
        title: `${ticker} — chat`,
      },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
  }

  const history: ChatTurn[] = conversation.messages.map((m) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: m.content,
  }));

  // Gather full company context in parallel.
  const [profile, quote, annual, segments, peers, concall, news, announcements] = await Promise.all([
    md.getProfile(ticker),
    md.getQuote(ticker),
    md.getAnnualFinancials(ticker, 10),
    md.getRevenueSegments(ticker),
    md.getPeers(ticker),
    md.getConcallSummary(ticker),
    md.getNews(ticker, 8),
    md.getCorporateAnnouncements({ ticker, limit: 8 }),
  ]);
  if (!profile) return NextResponse.json({ error: "Ticker not found" }, { status: 404 });

  const result = await runCompanyChat(
    { profile, annual, segments, peers, concall, news, announcements, currentPrice: quote?.price },
    history,
    parsed.data.question,
  );

  // Persist both turns.
  await prisma.$transaction([
    prisma.aIMessage.create({
      data: { conversationId: conversation.id, role: "user", content: parsed.data.question },
    }),
    prisma.aIMessage.create({
      data: {
        conversationId: conversation.id,
        role: "assistant",
        content: result.answer,
        toolCalls: result.sources.length ? { sources: result.sources } : undefined,
      },
    }),
    prisma.aIConversation.update({ where: { id: conversation.id }, data: { updatedAt: new Date() } }),
  ]);

  return NextResponse.json({
    conversationId: conversation.id,
    answer: result.answer,
    sources: result.sources,
  });
}

// Fetch the latest conversation for a ticker so the chat persists across reloads.
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const ticker = url.searchParams.get("ticker")?.toUpperCase();
  if (!ticker) return NextResponse.json({ error: "Missing ticker" }, { status: 400 });
  const conversation = await prisma.aIConversation.findFirst({
    where: { userId: session.user.id, ticker, agent: "company-chat" },
    orderBy: { updatedAt: "desc" },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  return NextResponse.json({ conversation });
}
