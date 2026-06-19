import { notFound } from "next/navigation";
import { marketData } from "@/lib/data";
import { CompanyHeader } from "./_components/header";
import { OverviewSection } from "./_components/overview";
import { FinancialsSection } from "./_components/financials";
import { ValuationSection } from "./_components/valuation";
import { PeersSection } from "./_components/peers";
import { AIAnalysisSection } from "./_components/ai-analysis";
import { NewsSection } from "./_components/news";
import { DocumentsSection } from "./_components/documents";
import { TabsShell } from "./_components/tabs-shell";

export const dynamic = "force-dynamic";

interface Props {
  params: { ticker: string };
}

export async function generateMetadata({ params }: Props) {
  return { title: `${params.ticker.toUpperCase()} · Research` };
}

export default async function CompanyResearchPage({ params }: Props) {
  const ticker = params.ticker.toUpperCase();
  const md = marketData();

  const [profile, quote, annual, quarterly, segments, peers, news] = await Promise.all([
    md.getProfile(ticker),
    md.getQuote(ticker),
    md.getAnnualFinancials(ticker, 10),
    md.getQuarterlyFinancials(ticker, 12),
    md.getRevenueSegments(ticker),
    md.getPeers(ticker),
    md.getNews(ticker, 12),
  ]);

  if (!profile) notFound();

  return (
    <div className="space-y-6">
      <CompanyHeader profile={profile} quote={quote ?? undefined} />
      <TabsShell
        ticker={ticker}
        tabs={[
          { value: "overview", label: "Overview", content: <OverviewSection profile={profile} segments={segments} annual={annual} /> },
          { value: "financials", label: "Financials", content: <FinancialsSection annual={annual} quarterly={quarterly} /> },
          { value: "valuation", label: "Valuation", content: <ValuationSection ticker={ticker} annual={annual} peers={peers} quote={quote ?? undefined} /> },
          { value: "peers", label: "Peers", content: <PeersSection peers={peers} self={profile.ticker} /> },
          { value: "ai", label: "AI Analysis", content: <AIAnalysisSection ticker={ticker} /> },
          { value: "news", label: "News", content: <NewsSection news={news} /> },
          { value: "documents", label: "Documents", content: <DocumentsSection ticker={ticker} /> },
        ]}
      />
    </div>
  );
}
