# Deployment Guide — Stock Research Copilot

Production deployment to **Vercel** (frontend + serverless backend) with **Supabase** or **Railway** for PostgreSQL.

## 1. Database

### Option A — Supabase
1. Create a project at https://supabase.com.
2. From `Project Settings → Database`, grab the connection string (pooled, port 6543 for Prisma transactions).
3. Set in Vercel:
   ```
   DATABASE_URL=postgresql://postgres.<project>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
   DIRECT_URL=postgresql://postgres.<project>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres
   ```
   If you set `DIRECT_URL`, add it to `prisma/schema.prisma` (`directUrl = env("DIRECT_URL")`) for migrations.

### Option B — Railway
1. Provision a `PostgreSQL` service.
2. Copy the `DATABASE_URL` from the service's `Connect` tab.

Then run:
```bash
npx prisma db push
npx prisma db seed
```

## 2. Vercel project

1. `vercel link` then `vercel --prod` or import the repo from the dashboard.
2. Set environment variables (Production + Preview):

   | Key | Required | Notes |
   |---|---|---|
   | `DATABASE_URL` | ✅ | Postgres URL (pooled for serverless) |
   | `AUTH_SECRET` | ✅ | `openssl rand -base64 32` |
   | `NEXTAUTH_URL` | ✅ | Your production URL |
   | `ANTHROPIC_API_KEY` | ⓘ | Required if using Claude |
   | `OPENAI_API_KEY` | ⓘ | Required if using GPT |
   | `LLM_PROVIDER` | ⓘ | `anthropic` (default) or `openai` |
   | `MARKET_DATA_PROVIDER` | ⓘ | `mock` / `fmp` / `alphavantage` |
   | `FMP_API_KEY` | ⓘ | If using FMP |
   | `ALPHA_VANTAGE_API_KEY` | ⓘ | If using Alpha Vantage |
   | `NEXT_PUBLIC_APP_URL` | ✅ | Same as `NEXTAUTH_URL` |

3. Build command: `npm run build`. Start command: `npm start`.

## 3. Custom serverless settings

Routes that talk to LLMs (`/api/ai/*`, `/api/thesis/[id]/monitor`, `/api/documents/upload`) declare `maxDuration = 60`. On Vercel Pro this allows up to 5 minutes if you need longer — adjust the constants in those route files.

## 4. Background tasks

The Thesis Monitor is on-demand by default. To run it on a schedule:

```bash
# vercel.json (production)
{
  "crons": [
    { "path": "/api/cron/monitor-theses", "schedule": "0 */6 * * *" }
  ]
}
```

Then add an authenticated cron endpoint at `app/api/cron/monitor-theses/route.ts` that iterates over `InvestmentThesis` rows and POSTs to the monitor endpoint.

## 5. Observability

- Vercel Analytics works out-of-the-box.
- Add structured logging in `lib/ai/client.ts` (tokens in/out are already returned) and persist to `AIMessage` when running a full report.

## 6. Migrating between providers

Switching data providers is a single env variable change. There is **no database migration** required — the provider abstraction is at the edge of the system.

```bash
# from mock to FMP
MARKET_DATA_PROVIDER=fmp
FMP_API_KEY=xxx
```

For LLM:
```bash
LLM_PROVIDER=openai
OPENAI_MODEL=gpt-4o
```

## 7. Security checklist

- [ ] `AUTH_SECRET` set and unique per environment
- [ ] DB connection uses pooled URL with `connection_limit=1`
- [ ] CORS not loosened (the app is same-origin)
- [ ] Rate-limit `/api/ai/*` with Vercel Edge Config or your gateway
- [ ] PDF uploads capped at 20 MB (configured in `next.config.js`)
- [ ] Database backups enabled on Supabase/Railway

## 8. Common issues

| Symptom | Fix |
|---|---|
| `prisma generate` fails on Vercel | `npm run build` already runs it; ensure `prisma` is in `devDependencies` and `@prisma/client` in `dependencies`. |
| `Cannot find module 'pdf-parse'` | Native fallback issue. Add `pdf-parse` to `dependencies`; do not preload at module top-level (we already dynamic-import). |
| 401 from `/api/auth/session` | `NEXTAUTH_URL` must match the deployment domain exactly. |
| Reports return `[AI offline]` | No LLM key configured. Set `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`. |
