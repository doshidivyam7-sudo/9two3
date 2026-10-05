# Quality at a reasonable price - first-look memos (2026-10-05)

Profitable, lowly geared compounders that are still growing and not priced for perfection.

Universe: nifty50.txt (50 names) → 5 passed the filters → 5 memos written.

Verdicts: **DEEP-DIVE** 1, **WATCHLIST** 2, **PASS** 2

| Verdict | Conv. | Ticker | Company | Score | One-liner |
|---|---|---|---|---|---|
| DEEP-DIVE | 3 | [TCS.NS](memos/TCS.NS.md) | Tata Consultancy Services Limited | 67.5 | 48% ROE, net cash and 15x earnings: the market prices structural AI decline. A deep-dive should test whether that is overdone. |
| WATCHLIST | 3 | [EICHERMOT.NS](memos/EICHERMOT.NS.md) | Eicher Motors Limited | 67.5 | Genuine franchise with debt-free 26% ROCE, but the GST-cut volume surge is fading fast and 33x already pays for it. |
| WATCHLIST | 3 | [HCLTECH.NS](memos/HCLTECH.NS.md) | HCL Technologies Limited | 65.0 | Solid returns and a 4.8% yield, but constant-currency growth is 2.6% and it costs more than TCS for lower quality. |
| PASS | 3 | [TECHM.NS](memos/TECHM.NS.md) | Tech Mahindra Limited | 57.5 | A margin turnaround that is working but already priced at 26.6x. Half the screened growth is the rupee, and ROE barely clears 15%. |
| PASS | 3 | [HINDUNILVR.NS](memos/HINDUNILVR.NS.md) | Hindustan Unilever Limited | 42.5 | The 30.7% ROE is flattered by a ₹4,611 cr demerger gain. Underlying it's a 2%-a-year grower at 41x after one good quarter. |

Screen rules: market_cap_cr >= 2000; roe_pct >= 15; debt_to_equity <= 0.5; pe >= 0 and <= 45; revenue_growth_pct >= 8; sector not in ['Financial Services']

## Run notes

- **No API.** The memos were written by hand in a Claude Code session from the screen's data pack plus web research (Q1 FY27 results, Aug–Sept 2026 news), then built with `--memos-from`. Sources are cited in each memo.
- **Universe refreshed.** `universes/nifty50.txt` was stale. Updated from niftyindices.com: BSE, INDIGO, MAXHEALTH and TMPV in; HEROMOTOCO, INDUSINDBK, TATAMOTORS and WIPRO out.
- **Data fixes in the loader.** (1) Yahoo's `returnOnEquity` was blank for 38 of 50 names, so nothing passed; ROE now falls back to annual net income over average equity. (2) Yahoo's growth fields compared against the wrong quarter: Coal India showed +45% revenue growth when the true June-quarter YoY was +7.8%. Growth now uses the same quarter a year earlier. Coal India drops out, and HCL Tech and HUL come in. (3) Market cap was missing for RELIANCE and TCS; it is now shares × price.
- **Screen-design caveat.** Revenue growth is in INR. With the rupee at record lows (~95/$ in May 2026), IT exporters clear the 8% bar on currency. Constant-currency growth was TCS 3.2%, HCL 2.6% and TechM 6.6%. Consider adding a `revenue_cagr_3y_pct` floor, or using constant-currency growth for exporters.
- **ROE caveat.** HUL's ROE includes a ₹4,611 cr demerger gain (underlying ~21%); TMPV's 72% ROE is a demerger artefact.
- **Near misses** worth a glance: BEL (P/E 45.0, just over the cap), Bajaj Auto (D/E 0.56 against a 0.5 limit), Coal India (revenue growth 7.8%), Infosys (revenue growth 2.9%).
