# Stock Research Copilot

Institutional-grade AI-powered equity research platform for Indian listed companies (NSE/BSE).

Think Bloomberg Terminal × Perplexity × AlphaSense × TIKR × Screener × Notion — for serious investors, family offices, and analysts.

## What's inside

- **Six specialised AI agents** orchestrated end-to-end: Research, Financial, Valuation, Earnings, Risk, Thesis.
- **10-year financial deep-dive**: revenue, EBITDA, PAT, OCF, FCF, ROCE, ROE, working-capital, debt — every chart a buy-side analyst expects.
- **DCF valuation** with adjustable assumptions, full sensitivity, and an AI-suggested set of inputs.
- **Relative valuation** vs peers across PE / EV-EBITDA / EV-Sales / P/B.
- **Earnings Call Intelligence** — upload an annual report, concall transcript, or investor PPT; the Earnings agent extracts guidance, capex plans, margin commentary, and red flags with verbatim quotes.
- **Thesis Monitor™** — record falsifiable theses with lead indicators; the agent continuously grades them as `Strengthened`, `Intact`, `Weakened`, or `Broken`, with reasoning and recommended action.
- **Watchlist & Portfolio** with live P&L and per-position notes.
- **Research Notes** — Notion-style journal for channel checks, meeting notes, and investment journals.
- **Dark-mode institutional UI** — no gamification, no retail-app colours, no emojis.

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 14 (App Router) · TypeScript |
| UI | Tailwind CSS · shadcn/ui · Lucide icons · Recharts |
| Auth | Auth.js (NextAuth v5) credentials provider |
| Database | PostgreSQL via Prisma |
| AI | Anthropic Claude (default) or OpenAI GPT — pluggable |
| Market data | NSE / BSE / FMP / Alpha Vantage / Polygon — pluggable abstraction |
| Document parsing | `pdf-parse` for PDFs and transcripts |

## Project structure

```
app/
  (auth)/                  # sign-in & sign-up
  (app)/                   # authenticated workspace
    dashboard/             # market indices, watchlist, recent reports, theses
    research/              # company search + research index
      [ticker]/            # main company research page (overview, financials, valuation, peers, AI, news, docs)
    thesis-monitor/        # Thesis Monitor™ list and detail
    portfolio/             # holdings with live P&L
    watchlist/             # watchlist with target prices
    notes/                 # research journal
    settings/              # provider & preferences
  api/
    auth/                  # NextAuth handlers + custom register endpoint
    companies/             # search & fetch
    valuation/             # DCF + AI assumption suggestion
    ai/                    # research, earnings agents
    thesis/                # CRUD + monitor pass
    documents/             # upload + listing
    watchlist/, portfolio/, notes/, preferences/

components/
  ui/                      # shadcn primitives
  charts/                  # FinancialTrend, SegmentPie
  layout/                  # Sidebar, Topbar

lib/
  ai/
    client.ts              # provider-agnostic complete()
    agents/                # research, financial, valuation, earnings, risk, thesis
    orchestrator.ts        # builds full report from all agents
    prompts/system.ts      # ANALYST_PERSONA + JSON schema helpers
  data/
    types.ts               # MarketDataProvider interface
    providers/
      mock.ts              # deterministic universe — works without API keys
      fmp.ts               # Financial Modeling Prep
      alpha-vantage.ts     # Alpha Vantage
    index.ts               # provider factory
  valuation/
    dcf.ts                 # two-stage FCFF DCF with sensitivity
    relative.ts            # peer multiples
  auth.ts, db.ts, format.ts, utils.ts

prisma/
  schema.prisma            # full database schema
  seed.ts                  # seeds NSE universe
```

## Getting started

```bash
# 1. Install
npm install

# 2. Configure environment
cp .env.example .env
# Fill DATABASE_URL, AUTH_SECRET (generate with `openssl rand -base64 32`),
# and at least one of ANTHROPIC_API_KEY / OPENAI_API_KEY.

# 3. Initialise database
npm run db:push
npm run db:seed

# 4. Run
npm run dev
```

Open http://localhost:3000, create an account, and try `RELIANCE`, `TCS`, `INOXINDIA`, or `HUDCO`.

## Configuring data & AI providers

The app ships with a deterministic mock provider so it works out-of-the-box. Plug in real data with one env change:

```bash
MARKET_DATA_PROVIDER=fmp
FMP_API_KEY=...
```

LLM provider is similarly swappable:

```bash
LLM_PROVIDER=anthropic        # or "openai"
ANTHROPIC_API_KEY=...
```

Adding a new provider:

1. Implement `MarketDataProvider` (`lib/data/types.ts`) in `lib/data/providers/yours.ts`.
2. Register it in the factory at `lib/data/index.ts`.

That's it — the UI and agents are completely insulated from the provider.

## AI agent architecture

Each agent is a single-shot, JSON-schema-bound call against the configured LLM provider:

| Agent | Input | Output |
|---|---|---|
| Research | profile, annual financials, peers, DCF intrinsic value | recommendation, scenarios (bull / base / bear), catalysts, risks, summary |
| Financial | annual financials | growth quality, return profile, B/S strength, observations, computed CAGRs |
| Valuation | profile, annual financials | DCF assumption set + rationale |
| Earnings | uploaded document text | guidance, growth drivers, capex, margin commentary, red flags, quotes |
| Risk | profile, annual financials, recent news | governance / business / financial / regulatory / macro risks, forensic screens, P(permanent loss) |
| Thesis | thesis text, lead indicators, new evidence | verdict (strengthened / intact / weakened / broken) + reasoning + action |

The orchestrator (`lib/ai/orchestrator.ts`) runs the first wave in parallel, computes a DCF, then runs the Research agent on the merged context.

## Deployment

See `DEPLOYMENT.md` for production deployment to Vercel + Supabase/Railway.

## License

Proprietary. Built for buy-side use. Not investment advice.
