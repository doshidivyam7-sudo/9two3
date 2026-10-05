# Quality at a reasonable price - first-look memos (2026-10-05)

Profitable, lowly geared compounders that are still growing and not priced for perfection.

Universe: nse_all.txt (2575 names) → 197 passed the filters → 10 memos written.

Verdicts: **DEEP-DIVE** 1, **WATCHLIST** 3, **PASS** 6

| Verdict | Conv. | Ticker | Company | Score | One-liner |
|---|---|---|---|---|---|
| DEEP-DIVE | 2 | [EMMVEE.NS](memos/EMMVEE.NS.md) | Emmvee Photovoltaic Power Limited | 83.7 | An integrated solar module-and-cell maker. Cells are the bottleneck under ALMM-II, and Emmvee is tripling cell capacity. But margins are at a record high in a module glut. |
| WATCHLIST | 3 | [OFSS.NS](memos/OFSS.NS.md) | Oracle Financial Services Software Limited | 81.6 | High-quality, cash-returning banking-software franchise. But Q1's surge is a ₹935 cr one-off licence, and it could mean losing that client's recurring work. |
| WATCHLIST | 2 | [NATIONALUM.NS](memos/NATIONALUM.NS.md) | National Aluminium Company Limited | 86.4 | A low-cost, debt-free aluminium/alumina PSU with real volume growth coming. But 9.2x is a peak-cycle multiple on 48% operating margins. |
| WATCHLIST | 2 | [GKENERGY.NS](memos/GKENERGY.NS.md) | GK Energy Limited | 82.0 | Fast-growing, cheap solar-pump EPC. But it depends on one government subsidy scheme, and the receivables are unverified. |
| PASS | 5 | [SPARC.NS](memos/SPARC.NS.md) | Sun Pharma Advanced Research Company Limited | 81.8 | The 277% ROE and 3.9x P/E come from selling one FDA priority review voucher for $195m. The R&D business burns cash. |
| PASS | 4 | [KIRIINDUS.NS](memos/KIRIINDUS.NS.md) | Kiri Industries Limited | 96.7 | The 0.6x P/E is a one-off ₹5,881 cr DyStar award. The operating dye business loses money, and the cash is going into copper. |
| PASS | 4 | [HINDZINC.NS](memos/HINDZINC.NS.md) | Hindustan Zinc Limited | 82.7 | A world-class low-cost miner riding a silver boom at peak margins. It is Vedanta-controlled, and its ROE is inflated by paying out its equity. |
| PASS | 4 | [CHENNPETRO.NS](memos/CHENNPETRO.NS.md) | Chennai Petroleum Corporation Limited | 80.3 | A refiner at a margin peak. GRMs went from $3.2 to $8.8/bbl, and a 4.9x P/E on peak earnings is the usual cyclical trap. |
| PASS | 3 | [WEBELSOLAR.NS](memos/WEBELSOLAR.NS.md) | Websol Energy System Limited | 81.3 | Sub-scale solar-cell maker with margins already compressing into a module glut. Promoters own 30%, and until recently 80% of that was pledged. |
| PASS | 3 | [SHANTIGOLD.NS](memos/SHANTIGOLD.NS.md) | Shanti Gold International Limited | 80.0 | Gold-price pass-through dressed as growth. It's a 6%-net-margin jewellery job shop with one dominant client, near its 52-week high. |

Screen rules: market_cap_cr >= 2000; roe_pct >= 15; debt_to_equity <= 0.5; pe >= 0 and <= 45; revenue_growth_pct >= 8; sector not in ['Financial Services']

## Run notes

- **Universe:** every NSE main-board equity, series EQ and BE (2,575 names, from NSE's `EQUITY_L.csv`). All 2,575 were fetched from Yahoo; none were lost to rate limits. 1,198 clear the ₹2,000 cr market-cap floor, and **197 pass every filter**; the full list is in `screen_results.csv`. Excluded: suspended (BZ) names, the NSE SME platform and BSE-only listings. The market-cap floor would drop nearly all of those anyway.
- **No API.** The memos were written by hand in a Claude Code session from the data pack plus web research, then built with `--memos-from`. Sources are cited in each memo.
- **What the whole-market top 10 shows:** the ranking rewards low P/E and high ROE/growth, and across 1,200 names that surfaces one-offs and cycle peaks first:
  - one-off gains: Kiri, from a litigation award; SPARC, from selling an FDA priority review voucher
  - commodity peaks: NALCO, Hindustan Zinc, Chennai Petroleum
  - price pass-through: Shanti Gold
  - the solar build-out: Emmvee, Websol, GK Energy

  Only Emmvee earned a DEEP-DIVE.
- **Suggested guards for whole-market runs** (not applied to this run, so the screen stays the same as the Nifty 50 run): `pe >= 5`; net margin no more than ~10 points above operating margin (catches other-income and exceptional gains); `revenue_cagr_3y_pct >= 10`; and excluding metals, mining, refining and bullion industries. Applying these by hand leaves 93 names. Beyond the memos above, the next-ranked are **Waaree Renewable Technologies, D. P. Abhushan, Waaree Energies, GRSE, BLS International, Atlanta Electricals, Swaraj Engines and MPI Manipal**. They are worth a second batch of memos.
- **Data caveats:** Yahoo's revenue growth is in INR, so exporters benefit from the weak rupee. Yahoo's sector field is what excludes Financial Services, and it misclassifies a handful of names.
