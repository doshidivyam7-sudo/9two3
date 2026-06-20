---
name: run
description: Launch the Stock Research Copilot dev server (Next.js 14 + Postgres + Prisma) and drive it with Playwright. Use whenever asked to run, start, screenshot, smoke-test, or verify the app.
---

# Running Stock Research Copilot

Next.js 14 web app, Postgres backed, Auth.js credentials. Cold-start
recipe for an ephemeral Linux container.

## 1. Postgres (required — schema uses `String[]` and `Json`, won't run on SQLite)

```bash
service postgresql start
sudo -u postgres psql -c "CREATE USER copilot WITH PASSWORD 'copilot' SUPERUSER;" 2>/dev/null || true
sudo -u postgres psql -c "CREATE DATABASE stock_research_copilot OWNER copilot;" 2>/dev/null || true
pg_isready   # → accepting connections
```

## 2. `.env` (in repo root)

```bash
cat > .env <<'EOF'
DATABASE_URL="postgresql://copilot:copilot@localhost:5432/stock_research_copilot?schema=public"
AUTH_SECRET="dev-secret-only-for-local-runs-do-not-use-in-prod-abcdef1234567890"
NEXTAUTH_URL="http://localhost:3000"
MARKET_DATA_PROVIDER="mock"
LLM_PROVIDER="anthropic"
NEXT_PUBLIC_APP_NAME="Stock Research Copilot"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
EOF
```

Without `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` the AI agents return
clearly-labeled `[AI offline]` fallbacks — the UI still works, just
without real LLM output.

## 3. Install (pin already correct in package.json; if a fresh resolve fails)

```bash
npm install --no-audit --no-fund --loglevel=error
```

`postinstall` runs `prisma generate` automatically.

**If you see ERESOLVE on ESLint:** `eslint-config-next@14` only accepts
ESLint 7/8. The lockfile pins to `^8.57.1`; if anyone bumps it back to 9
the install breaks. Don't `--force` — fix the version.

## 4. Schema + seed

```bash
npx prisma db push --skip-generate           # syncs schema
npx prisma db seed                           # 7 NSE companies
```

Use `npx prisma db seed` (loads `.env`), not `npx tsx prisma/seed.ts`
(does not). The seed script reads `DATABASE_URL` from process env.

## 5. Dev server

```bash
pkill -f "next dev" 2>/dev/null              # kill any prior run
nohup npm run dev > /tmp/dev.log 2>&1 &
disown
timeout 60 bash -c 'until curl -sf http://localhost:3000 >/dev/null; do sleep 1; done'
```

First page hit compiles a route (3-5s); subsequent navigations are fast.
Check `/tmp/dev.log` if a route returns 500 — Next.js dev logs the stack
there. Stop with `pkill -f "next dev"`.

## 6. Drive it (Playwright; no `chromium-cli` in this container)

```bash
cat > /tmp/drive.mjs <<'EOF'
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('pageerror:', e.message));
page.on('console', (m) => m.type() === 'error' && console.log('console.error:', m.text()));

// Register + sign in — Auth.js does it in one POST after sign-up
await page.goto('http://localhost:3000/sign-up');
await page.fill('#name', 'Smoke');
await page.fill('#email', `smoke-${Date.now()}@example.com`);
await page.fill('#password', 'supersecret123');
await Promise.all([
  page.waitForURL('**/dashboard', { timeout: 30000 }),
  page.click('button[type="submit"]'),
]);

await page.goto('http://localhost:3000/research/INOXINDIA');
await page.waitForSelector('text=INOX India Limited');
await page.screenshot({ path: '/tmp/research.png' });

await browser.close();
EOF
node /tmp/drive.mjs
```

Then **read** `/tmp/research.png` with the Read tool to verify the page
actually rendered — a 200 isn't proof of render.

## 7. Auth shortcut for API smoke (no browser)

```bash
EMAIL="smoke-$(date +%s)@example.com"
curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Smoke\",\"email\":\"$EMAIL\",\"password\":\"supersecret123\"}"

C=/tmp/cookies.txt; rm -f $C
CSRF=$(curl -s -c $C http://localhost:3000/api/auth/csrf | python3 -c "import sys,json; print(json.load(sys.stdin)['csrfToken'])")
curl -s -b $C -c $C -o /dev/null \
  -X POST http://localhost:3000/api/auth/callback/credentials \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "csrfToken=$CSRF&email=$EMAIL&password=supersecret123&redirect=false&json=true"

# now use -b $C on every authenticated request
curl -s -b $C http://localhost:3000/api/auth/session
```

## Gotchas hit in past runs

- **Mock annuals must stay newest-first.** UI reads `annual[0]` as latest
  FY. If a future change reverses the order, INOXINDIA's "Latest FY
  revenue" reads ₹191 Cr instead of ₹1,144 Cr and the DCF base collapses.
- **Chart formatter uses `en-US` compact** (`lib/format.ts`). Don't switch
  to `en-IN` — it renders 1,200 as "1.2T" (Hindi thousand), which reads
  as trillion to anyone outside India.
- **AI client offline mode returns `json: undefined`** (`lib/ai/client.ts`).
  Don't set a placeholder JSON object — agents will cast it to their
  schema and the orchestrator crashes on `assumptions.wacc`.
- **All `/api/*` routes are auth-gated by middleware.** Forgetting cookies
  on `curl` returns a 307 to `/sign-in?redirect=…`, not a JSON error.
- **AI report screenshot races the spinner.** After clicking "Run all
  agents", `waitForSelector('text=Investment thesis')` returns the
  moment React commits — add `await page.waitForTimeout(500)` before
  screenshotting so the loading icon clears.
