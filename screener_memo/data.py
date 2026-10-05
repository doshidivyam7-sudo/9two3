"""Fundamental data loaders.

Every loader returns a DataFrame with the canonical columns in FIELDS. Ratios
are stored as plain percentages (18.5 means 18.5%), except debt_to_equity,
pe and pb, which are plain multiples. Market cap is in crore (1e7) of the
listing currency.
"""

from __future__ import annotations

import logging
import math
from pathlib import Path

import pandas as pd

log = logging.getLogger(__name__)

FIELDS = [
    "ticker", "name", "sector", "industry", "price", "market_cap_cr",
    "pe", "pb", "roe_pct", "roce_pct", "debt_to_equity",
    "op_margin_pct", "net_margin_pct",
    "revenue_growth_pct", "earnings_growth_pct", "revenue_cagr_3y_pct",
    "fcf_yield_pct", "dividend_yield_pct",
    "pct_from_52w_high", "return_12m_pct",
    "summary",
]
TEXT_FIELDS = {"ticker", "name", "sector", "industry", "summary"}
NUMERIC_FIELDS = [f for f in FIELDS if f not in TEXT_FIELDS]


def read_universe(path: str | Path) -> list[str]:
    tickers = []
    for line in Path(path).read_text().splitlines():
        line = line.split("#", 1)[0].strip()
        if line:
            tickers.append(line)
    return list(dict.fromkeys(tickers))


def _num(x):
    try:
        x = float(x)
    except (TypeError, ValueError):
        return None
    return None if math.isnan(x) or math.isinf(x) else x


def _pct(x):
    x = _num(x)
    return None if x is None else x * 100


# ---------------------------------------------------------------- yfinance --

def _yoy(series: pd.Series):
    """Latest quarter vs the quarter ending ~12 months earlier, in percent."""
    if series.empty:
        return None
    latest_date, latest = series.index[0], series.iloc[0]
    for date, prev in series.iloc[1:].items():
        if abs((latest_date - date).days - 365) <= 20:
            return (latest / prev - 1) * 100 if prev > 0 else None
    return None


def _yf_row(ticker: str) -> dict:
    import yfinance as yf

    t = yf.Ticker(ticker)
    info = t.info or {}
    if not info.get("shortName") and not info.get("longName"):
        raise ValueError("no data returned")

    price = _num(info.get("currentPrice") or info.get("regularMarketPrice"))
    mcap = _num(info.get("marketCap"))
    shares = _num(info.get("sharesOutstanding") or info.get("impliedSharesOutstanding"))
    if not mcap and shares and price:  # Yahoo sometimes drops marketCap for large NSE names
        mcap = shares * price
    fcf = _num(info.get("freeCashflow"))
    hi = _num(info.get("fiftyTwoWeekHigh"))
    de = _num(info.get("debtToEquity"))  # Yahoo reports this as a percentage

    row = {
        "ticker": ticker,
        "name": info.get("longName") or info.get("shortName"),
        "sector": info.get("sector"),
        "industry": info.get("industry"),
        "price": price,
        "market_cap_cr": mcap / 1e7 if mcap else None,
        "pe": _num(info.get("trailingPE")),
        "pb": _num(info.get("priceToBook")),
        "roe_pct": _pct(info.get("returnOnEquity")),
        "roce_pct": None,
        "debt_to_equity": de / 100 if de is not None else None,
        "op_margin_pct": _pct(info.get("operatingMargins")),
        "net_margin_pct": _pct(info.get("profitMargins")),
        "revenue_growth_pct": _pct(info.get("revenueGrowth")),
        "earnings_growth_pct": _pct(info.get("earningsGrowth")),
        "revenue_cagr_3y_pct": None,
        "fcf_yield_pct": fcf / mcap * 100 if fcf is not None and mcap else None,
        "dividend_yield_pct": _num(info.get("dividendYield")),
        "pct_from_52w_high": (price / hi - 1) * 100 if price and hi else None,
        "return_12m_pct": _pct(info.get("52WeekChange")),
        "summary": info.get("longBusinessSummary"),
    }

    # 3-year revenue CAGR, ROCE and (when Yahoo omits it) ROE and market cap
    # from the annual statements, when present.
    try:
        inc = t.income_stmt
        rev = inc.loc["Total Revenue"].dropna() if "Total Revenue" in inc.index else None
        if rev is not None and len(rev) >= 4 and rev.iloc[3] > 0:
            row["revenue_cagr_3y_pct"] = ((rev.iloc[0] / rev.iloc[3]) ** (1 / 3) - 1) * 100
        bs = t.balance_sheet
        if "EBIT" in inc.index and {"Total Assets", "Current Liabilities"} <= set(bs.index):
            ebit = inc.loc["EBIT"].iloc[0]
            cap_employed = bs.loc["Total Assets"].iloc[0] - bs.loc["Current Liabilities"].iloc[0]
            if cap_employed and cap_employed > 0:
                row["roce_pct"] = _num(ebit / cap_employed * 100)
        # Yahoo leaves returnOnEquity blank for most NSE names: latest annual
        # net income over average shareholders' equity.
        if row["roe_pct"] is None and "Net Income" in inc.index and "Stockholders Equity" in bs.index:
            ni = inc.loc["Net Income"].dropna()
            eq = bs.loc["Stockholders Equity"].dropna()
            if len(ni) and len(eq):
                avg_eq = eq.iloc[:2].mean()
                if avg_eq > 0:
                    row["roe_pct"] = _num(ni.iloc[0] / avg_eq * 100)
        # Yahoo's revenueGrowth / earningsGrowth can compare against the wrong
        # quarter (Coal India read +45% when the true YoY was +8%). Prefer the
        # latest quarter vs the same quarter a year earlier, when both exist.
        q = t.quarterly_income_stmt
        for field, line in (("revenue_growth_pct", "Total Revenue"),
                            ("earnings_growth_pct", "Net Income")):
            yoy = _yoy(q.loc[line].dropna()) if line in q.index else None
            if yoy is not None:
                row[field] = yoy
        if row["market_cap_cr"] is None and price and "Ordinary Shares Number" in bs.index:
            n = bs.loc["Ordinary Shares Number"].dropna()
            if len(n):
                row["market_cap_cr"] = _num(n.iloc[0] * price / 1e7)
    except Exception as e:  # statements are best-effort
        log.debug("%s: statements unavailable (%s)", ticker, e)
    return row


def load_yfinance(tickers: list[str], workers: int = 8) -> pd.DataFrame:
    from concurrent.futures import ThreadPoolExecutor

    rows = []

    def fetch(tk):
        try:
            return _yf_row(tk)
        except Exception as e:
            log.warning("skipping %s: %s", tk, e)
            return None

    with ThreadPoolExecutor(max_workers=workers) as pool:
        for row in pool.map(fetch, tickers):
            if row:
                rows.append(row)
    if not rows:
        raise RuntimeError("yfinance returned no data for any ticker (network blocked?)")
    return _normalise(pd.DataFrame(rows))


# --------------------------------------------------------------------- CSV --

# Lower-cased header -> canonical field. Covers Screener.in exports and
# common hand-built spreadsheets; anything else can be renamed to the
# canonical name directly.
CSV_ALIASES = {
    "symbol": "ticker", "nse code": "ticker", "nse symbol": "ticker",
    "company": "name", "company name": "name",
    "cmp rs.": "price", "cmp": "price", "current price": "price",
    "mar cap rs.cr.": "market_cap_cr", "market cap": "market_cap_cr",
    "market capitalization": "market_cap_cr",
    "p/e": "pe", "price to earning": "pe",
    "cmp / bv": "pb", "price to book value": "pb", "p/b": "pb",
    "roe %": "roe_pct", "return on equity": "roe_pct",
    "roce %": "roce_pct", "return on capital employed": "roce_pct",
    "debt / eq": "debt_to_equity", "debt to equity": "debt_to_equity",
    "opm %": "op_margin_pct", "opm": "op_margin_pct",
    "npm %": "net_margin_pct",
    "sales var 3yrs %": "revenue_cagr_3y_pct", "sales growth 3years": "revenue_cagr_3y_pct",
    "qtr sales var %": "revenue_growth_pct", "sales growth": "revenue_growth_pct",
    "qtr profit var %": "earnings_growth_pct", "profit growth": "earnings_growth_pct",
    "div yld %": "dividend_yield_pct", "dividend yield": "dividend_yield_pct",
    "1yr return %": "return_12m_pct", "return over 1year": "return_12m_pct",
    "industry group": "industry",
}


def load_csv(path: str | Path) -> pd.DataFrame:
    df = pd.read_csv(path)
    rename = {}
    for col in df.columns:
        key = col.strip().lower()
        if key in FIELDS:
            rename[col] = key
        elif key in CSV_ALIASES:
            rename[col] = CSV_ALIASES[key]
    df = df.rename(columns=rename)
    df = df.loc[:, ~df.columns.duplicated()]
    if "ticker" not in df.columns:
        if "name" not in df.columns:
            raise ValueError(f"{path}: needs a ticker or name column")
        df["ticker"] = df["name"]
    return _normalise(df)


def _normalise(df: pd.DataFrame) -> pd.DataFrame:
    for f in FIELDS:
        if f not in df.columns:
            df[f] = None
    for f in NUMERIC_FIELDS:
        df[f] = pd.to_numeric(df[f], errors="coerce")
    df["name"] = df["name"].fillna(df["ticker"])
    return df[FIELDS].reset_index(drop=True)
