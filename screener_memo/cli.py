"""screen -> memos -> index.

    python -m screener_memo --screen screens/quality_value.toml --universe universes/nifty50.txt
    python -m screener_memo --screen screens/quality_value.toml --csv screener_export.csv
"""

from __future__ import annotations

import argparse
import datetime as dt
import logging
import re
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from .data import load_csv, load_yfinance, read_universe
from .memo import DEFAULT_MODEL, Memo, MemoWriter, data_pack, parse_memo
from .screen import Screen, run_screen

log = logging.getLogger("screener_memo")

VERDICT_ORDER = {"DEEP-DIVE": 0, "WATCHLIST": 1, "PASS": 2, "UNPARSED": 3, "ERROR": 4}


def _slug(s: str) -> str:
    return re.sub(r"[^A-Za-z0-9._-]+", "_", s).strip("_")


def _memo_markdown(m: Memo, row: dict, screen: Screen, run_date: str) -> str:
    out = [
        f"# {m.name} ({m.ticker}) - First Look",
        "",
        f"**Verdict:** {m.verdict}"
        + (f" &nbsp;|&nbsp; **Conviction:** {m.conviction}/5" if m.conviction else "")
        + f" &nbsp;|&nbsp; **Screen score:** {row['score']}",
        "",
    ]
    if m.one_liner:
        out += [f"> {m.one_liner}", ""]
    if m.error:
        out += [f"> **Warning:** {m.error}", ""]
    out += [m.body or "_No memo text was produced._", ""]
    if m.sources:
        out += ["## Sources", ""] + [f"- [{t}]({u})" for u, t in m.sources] + [""]
    out += [
        "---",
        f"_Screen: {screen.name} · run {run_date} · model {m.model or 'n/a'} · "
        "first-look triage, not investment advice._",
        "",
    ]
    return "\n".join(out)


def _index_markdown(memos: list[tuple[Memo, dict]], screen: Screen, universe_label: str,
                    n_universe: int, n_passed: int, run_date: str) -> str:
    memos = sorted(memos, key=lambda p: (VERDICT_ORDER.get(p[0].verdict, 9),
                                         -(p[0].conviction or 0), -p[1]["score"]))
    counts = {v: sum(1 for m, _ in memos if m.verdict == v) for v in VERDICT_ORDER}
    out = [
        f"# {screen.name} - first-look memos ({run_date})",
        "",
        screen.description,
        "",
        f"Universe: {universe_label} ({n_universe} names) → "
        f"{n_passed} passed the filters → {len(memos)} memos written.",
        "",
        "Verdicts: " + ", ".join(f"**{v}** {c}" for v, c in counts.items() if c),
        "",
        "| Verdict | Conv. | Ticker | Company | Score | One-liner |",
        "|---|---|---|---|---|---|",
    ]
    for m, row in memos:
        link = f"[{m.ticker}](memos/{_slug(m.ticker)}.md)"
        line = (m.one_liner or m.error or "").replace("|", "\\|")
        out.append(f"| {m.verdict} | {m.conviction or ''} | {link} | {m.name} | {row['score']} | {line} |")
    out += ["", "Screen rules: " + ("; ".join(screen.describe_rules()) or "none"), ""]
    return "\n".join(out)


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(prog="screener_memo", description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--screen", required=True, help="screen definition (.toml)")
    src = p.add_mutually_exclusive_group(required=True)
    src.add_argument("--universe", help="ticker list, one Yahoo symbol per line (fetched via yfinance)")
    src.add_argument("--csv", help="fundamentals CSV (e.g. a Screener.in export)")
    p.add_argument("--top", type=int, help="memo at most this many hits (default: screen's top_n)")
    p.add_argument("--out", default="output", help="output root (default: output/)")
    p.add_argument("--model", default=DEFAULT_MODEL)
    p.add_argument("--effort", default="medium", choices=["low", "medium", "high", "xhigh", "max"])
    p.add_argument("--no-web", action="store_true", help="don't let Claude search the web")
    p.add_argument("--workers", type=int, default=4, help="memos written in parallel")
    p.add_argument("--fetch-workers", type=int, default=8, help="parallel Yahoo requests")
    p.add_argument("--cache", help="per-ticker fundamentals cache (default: <out>/.cache/yf_<date>); "
                                   "re-running resumes a rate-limited fetch")
    p.add_argument("--screen-only", action="store_true", help="run the screen, skip memos")
    p.add_argument("--dry-run", action="store_true",
                   help="write the data pack Claude would see, without calling the API")
    p.add_argument("--memos-from", metavar="DIR",
                   help="build memos and index from hand-written <TICKER>.md files in DIR "
                        "(same VERDICT/CONVICTION/ONE-LINER header), without calling the API")
    p.add_argument("-v", "--verbose", action="store_true")
    args = p.parse_args(argv)

    logging.basicConfig(level=logging.DEBUG if args.verbose else logging.INFO,
                        format="%(levelname)s %(message)s")
    for noisy in ("httpx", "httpx2", "yfinance", "anthropic"):
        logging.getLogger(noisy).setLevel(logging.WARNING)

    screen = Screen.load(args.screen)
    if args.csv:
        universe_label = Path(args.csv).name
        df = load_csv(args.csv)
    else:
        universe_label = Path(args.universe).name
        tickers = read_universe(args.universe)
        log.info("fetching fundamentals for %d tickers ...", len(tickers))
        mcap_floor = screen.filters.get("market_cap_cr", {}).get("min")
        cache_dir = args.cache or Path(args.out) / ".cache" / f"yf_{dt.date.today().isoformat()}"
        df = load_yfinance(tickers, workers=args.fetch_workers, min_mcap_cr=mcap_floor,
                           cache_dir=cache_dir)
    n_universe = len(df)

    all_passed = run_screen(df, screen, top_n=len(df))
    hits = all_passed.head(args.top or screen.top_n)
    log.info("%s: %d of %d names passed; taking top %d", screen.name, len(all_passed), n_universe, len(hits))

    run_date = dt.date.today().isoformat()
    out_dir = Path(args.out) / f"{run_date}_{_slug(Path(args.screen).stem)}"
    (out_dir / "memos").mkdir(parents=True, exist_ok=True)
    df.to_csv(out_dir / "universe.csv", index=False)
    all_passed.drop(columns=["summary"]).to_csv(out_dir / "screen_results.csv", index=False)

    if hits.empty:
        log.info("nothing passed the screen - loosen the filters in %s", args.screen)
        return 0
    print(hits[["ticker", "name", "score"]].to_string(index=False))
    if args.screen_only:
        log.info("wrote %s", out_dir / "screen_results.csv")
        return 0

    rows = hits.to_dict("records")
    if args.dry_run:
        for row in rows:
            (out_dir / "memos" / f"{_slug(row['ticker'])}.datapack.txt").write_text(
                data_pack(row, screen, universe_label))
        log.info("dry run: wrote %d data packs to %s", len(rows), out_dir / "memos")
        return 0

    results: list[tuple[Memo, dict]] = []

    def record(memo: Memo, row: dict) -> None:
        (out_dir / "memos" / f"{_slug(memo.ticker)}.md").write_text(
            _memo_markdown(memo, row, screen, run_date))
        log.info("%-14s %-10s %s", memo.ticker, memo.verdict, memo.error or memo.one_liner)
        results.append((memo, row))

    if args.memos_from:
        for row in rows:
            memo = Memo(ticker=row["ticker"], name=row.get("name") or row["ticker"],
                        model="hand-written")
            src_file = Path(args.memos_from) / f"{_slug(row['ticker'])}.md"
            if src_file.exists():
                parse_memo(src_file.read_text(), memo)
            else:
                memo.error = f"no hand-written memo at {src_file}"
            record(memo, row)
    else:
        writer = MemoWriter(model=args.model, effort=args.effort, web_search=not args.no_web,
                            mandate=screen.mandate)
        with ThreadPoolExecutor(max_workers=args.workers) as pool:
            futures = {pool.submit(writer.write, row, screen, universe_label): row for row in rows}
            for fut in as_completed(futures):
                record(fut.result(), futures[fut])

    (out_dir / "index.md").write_text(
        _index_markdown(results, screen, universe_label, n_universe, len(all_passed), run_date))
    tokens_in = sum(m.usage.get("input_tokens", 0) for m, _ in results)
    tokens_out = sum(m.usage.get("output_tokens", 0) for m, _ in results)
    log.info("done: %s  (tokens in %s, out %s)", out_dir / "index.md", f"{tokens_in:,}", f"{tokens_out:,}")
    return 1 if all(m.error and not m.body for m, _ in results) else 0


if __name__ == "__main__":
    sys.exit(main())
