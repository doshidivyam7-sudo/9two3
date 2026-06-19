import Link from "next/link";
import { ArrowRight, ShieldCheck, LineChart, Brain, Eye, Briefcase, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const FEATURES = [
  {
    icon: Brain,
    title: "Agent-orchestrated research",
    body: "Six specialised agents — Research, Financial, Valuation, Earnings, Risk, Thesis — produce one decision-grade report.",
  },
  {
    icon: LineChart,
    title: "10-year financial deep-dive",
    body: "Revenue, EBITDA, PAT, OCF, FCF, ROCE, ROE, working-capital, debt — visualised the way buy-side analysts read them.",
  },
  {
    icon: ShieldCheck,
    title: "Thesis Monitor™",
    body: "Record a thesis, watch the indicators that would falsify it, and get alerted when results, news, or concalls strengthen or break it.",
  },
  {
    icon: Eye,
    title: "Built for buy-side process",
    body: "Watchlists, target prices, conviction levels, scenarios, downside-first risk reviews. No gamification.",
  },
];

const TICKERS = ["RELIANCE", "TCS", "INFY", "HDFCBANK", "BAJFINANCE", "INOXINDIA", "HUDCO"];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 terminal-grid opacity-30 [mask-image:radial-gradient(ellipse_at_top,white,transparent_70%)]" />
      <header className="relative z-10 mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <div className="h-6 w-6 rounded bg-primary/15 ring-1 ring-primary/30" />
          Stock Research Copilot
        </div>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <Link href="#features" className="hover:text-foreground">Features</Link>
          <Link href="#thesis" className="hover:text-foreground">Thesis Monitor</Link>
          <Link href="/sign-in" className="hover:text-foreground">Sign in</Link>
        </nav>
        <Button asChild size="sm">
          <Link href="/sign-up">Get started <ArrowRight className="h-3.5 w-3.5" /></Link>
        </Button>
      </header>

      <section className="relative z-10 mx-auto max-w-6xl px-6 pt-20 pb-24 text-center">
        <Badge variant="info" className="mx-auto mb-6">
          Built for serious investors, family offices, and analysts
        </Badge>
        <h1 className="mx-auto max-w-3xl text-5xl font-semibold leading-tight tracking-tight md:text-6xl">
          The institutional-grade<br />
          <span className="bg-gradient-to-r from-primary via-info to-[hsl(var(--bull))] bg-clip-text text-transparent">
            equity research platform for India
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-balance text-base text-muted-foreground md:text-lg">
          Bloomberg Terminal meets Perplexity meets AlphaSense — for NSE/BSE listed companies.
          Generate a complete research report, run a DCF, and monitor every thesis you hold.
        </p>
        <div className="mx-auto mt-8 flex max-w-md flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild size="lg">
            <Link href="/sign-up">Start researching <ArrowRight className="h-4 w-4" /></Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/sign-in">Sign in</Link>
          </Button>
        </div>
        <div className="mt-12 flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">Try it on</span>
          {TICKERS.map((t) => (
            <Link
              key={t}
              href={`/research/${t}`}
              className="rounded-md border border-border bg-card px-2.5 py-1 font-mono text-xs hover:border-foreground/30"
            >
              {t}
            </Link>
          ))}
        </div>
      </section>

      <section id="features" className="relative z-10 mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-4 sm:grid-cols-2">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="rounded-lg border border-border bg-card p-6">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section id="thesis" className="relative z-10 mx-auto max-w-6xl px-6 pb-24">
        <div className="rounded-xl border border-border bg-card p-8 md:p-12">
          <Badge variant="default" className="mb-4">Thesis Monitor™ · Signature feature</Badge>
          <h2 className="max-w-2xl text-3xl font-semibold tracking-tight md:text-4xl">
            Your thesis, continuously stress-tested.
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Record what you believe and why. The Thesis agent watches new results, news, and concall
            commentary, then grades the thesis as <span className="text-[hsl(var(--bull))]">strengthened</span>,
            intact, <span className="text-[hsl(var(--warn))]">weakened</span>, or
            <span className="text-[hsl(var(--bear))]"> broken</span> — with reasoning and the next action.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              { title: "Falsifiable", icon: ShieldCheck, body: "Lead indicators make your thesis testable, not narrative." },
              { title: "Evidence-linked", icon: FileText, body: "Every verdict cites the result, news item, or concall snippet that moved it." },
              { title: "Actionable", icon: Briefcase, body: "Recommended action — hold, add, trim, exit — every time the thesis is re-graded." },
            ].map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.title} className="rounded-md border border-border bg-background/40 p-4">
                  <Icon className="h-4 w-4 text-primary" />
                  <div className="mt-3 text-sm font-semibold">{c.title}</div>
                  <p className="mt-1 text-xs text-muted-foreground">{c.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 text-xs text-muted-foreground">
          <div>Stock Research Copilot · Not investment advice.</div>
          <div className="flex gap-4">
            <Link href="/sign-in" className="hover:text-foreground">Sign in</Link>
            <Link href="/sign-up" className="hover:text-foreground">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
