# Screener-to-memo agent

Runs a quant screen over a stock universe, then has Claude write a one-page
**first look** memo on each hit. Each memo gives a verdict (DEEP-DIVE /
WATCHLIST / PASS), a conviction score, and the red flags the screen can't see,
so you only spend deep-dive time on the names that hold up.

```
universe ──► fundamentals ──► filters + ranking ──► top N hits ──► Claude (+ web search) ──► memos/ + index.md
```

## Setup

```bash
pip install -r requirements.txt
export ANTHROPIC_API_KEY=sk-ant-...
```

## Run

```bash
# Live data from Yahoo Finance (NSE tickers end in .NS, BSE in .BO)
python -m screener_memo --screen screens/quality_value.toml --universe universes/nifty50.txt

# The whole NSE main board (~2,600 names). Fetches are cached per ticker under
# output/.cache/, so re-running resumes after Yahoo rate-limits.
python -m screener_memo --screen screens/quality_value.toml --universe universes/nse_all.txt --fetch-workers 4

# Or a fundamentals CSV, e.g. a Screener.in screen export
python -m screener_memo --screen screens/deep_value.toml --csv my_export.csv --top 5
```

Output goes to `output/<date>_<screen>/`:

| File | What it is |
|---|---|
| `index.md` | Every hit, sorted DEEP-DIVE first, with conviction, score and a one-line thesis. Start here. |
| `memos/<TICKER>.md` | The one-page memo, with cited web sources |
| `screen_results.csv` | Every name that passed the filters, with its score |
| `universe.csv` | The raw fundamentals the screen ran on |

Useful flags:

- `--screen-only`: run the screen and stop. No API calls.
- `--dry-run`: write the exact data pack Claude would see for each hit, without calling the API.
- `--memos-from DIR`: skip the API and build the memos and index from hand-written
  `DIR/<TICKER>.md` files that use the same `VERDICT:` / `CONVICTION:` / `ONE-LINER:` header.
  Pair it with `--dry-run` to get the data packs to write from.
- `--no-web`: memos are written from the data pack only. This is cheaper, but recent news isn't checked.
- `--effort low|medium|high|xhigh|max`: how hard Claude thinks per memo (default `medium`).
- `--fetch-workers N`: parallel Yahoo requests (default 8; use 4 for whole-market runs).
- `--cache DIR`: per-ticker fundamentals cache (default `<out>/.cache/yf_<date>`).
- `--top N`, `--workers N`, `--model`, `--out`.

## Writing a screen

Screens are TOML files in `screens/`:

```toml
name = "Quality at a reasonable price"
top_n = 10
exclude_sectors = ["Financial Services"]

[filters]                       # hard cut-offs; a missing value fails...
roe_pct        = { min = 15 }
debt_to_equity = { max = 0.5, allow_missing = true }   # ...unless allowed

[rank]                          # weighted percentile rank of the survivors
roe_pct = 1.0                   # positive weight: higher is better
pe      = -1.0                  # negative weight: lower is better

[memo]
mandate = "Long-only, 3-5 year horizon, avoids governance risk."  # passed to Claude
```

Available metrics: `price, market_cap_cr, pe, pb, roe_pct, roce_pct,
debt_to_equity, op_margin_pct, net_margin_pct, revenue_growth_pct,
earnings_growth_pct, revenue_cagr_3y_pct, fcf_yield_pct, dividend_yield_pct,
pct_from_52w_high, return_12m_pct`. Percentages are plain numbers (18.5 means
18.5%), and market cap is in crore.

## Data sources

- **yfinance** (`--universe`): free, and covers NSE/BSE and most other markets.
  ROCE and the 3-year revenue CAGR come from the annual statements when Yahoo
  has them. So do ROE and market cap when Yahoo leaves them blank (it omits ROE
  for most NSE names). Revenue and earnings growth are the latest quarter vs the
  same quarter a year earlier, from the quarterly statements. Expect occasional gaps and stale fields.
- **CSV** (`--csv`): Screener.in column names (`P/E`, `ROCE %`, `Mar Cap Rs.Cr.`,
  `Debt / Eq`, `Qtr Sales Var %`, ...) are mapped automatically. Any other
  column can be renamed to a metric name above. Use this when you trust your
  own data more than Yahoo's.

## How the memo step works

For each hit, Claude gets the screen's rules and that company's metrics, then
uses web search to check the latest results, governance and promoter issues,
and recent news before it writes. The prompt (`screener_memo/memo.py`) is
skeptical by design: its job is to explain away value traps, one-off earnings
spikes and cyclical peaks before anyone spends a week on them. Numbers must
come from the data pack or a cited source.

The memos are triage, not research. Check anything that matters before acting on it.

## Tests

```bash
python -m pytest tests     # offline: synthetic fixtures + a fake Claude client
```
