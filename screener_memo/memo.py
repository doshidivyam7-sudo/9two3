"""One-page first-look memos, written by Claude from the screen's data pack."""

from __future__ import annotations

import json
import logging
import re
from dataclasses import dataclass, field

import anthropic

log = logging.getLogger(__name__)

DEFAULT_MODEL = "claude-opus-5-5"
VERDICTS = ("DEEP-DIVE", "WATCHLIST", "PASS")

SYSTEM_PROMPT = """\
You are a senior buy-side analyst triaging the output of a quantitative stock \
screen. For each company you write a one-page "first look" memo whose only job \
is to decide whether the name deserves a full deep-dive. You are skeptical by \
default: screens throw up value traps, one-off earnings spikes, accounting \
quirks, cyclical peaks, and holding-company discounts, and your memo should \
catch those before anyone spends a week on the name.

Ground rules:
- Every number you cite comes from the data pack or from a source you found \
with web search. Never invent figures. If a metric is missing or looks wrong \
(stale, wrong units, distorted by a one-off), say so.
- Use web search to check what the screen cannot see: the latest quarterly \
results, management commentary, governance or promoter-pledge issues, \
regulatory action, large corporate actions, and recent news. Prefer primary \
sources (exchange filings, company investor-relations pages) and reputable \
financial press.
- Write for a portfolio manager who has 90 seconds. Plain, specific sentences; \
no boilerplate, no hedging filler. Stay under 550 words in total.

Output format - follow it exactly. The first three lines are machine-read:

VERDICT: <DEEP-DIVE | WATCHLIST | PASS>
CONVICTION: <1-5, how confident you are in that verdict>
ONE-LINER: <one sentence, at most 25 words: the thesis or the reason to pass>

## Why it screened
## What the business does
## What looks good
## What could be wrong
## Valuation sanity check
## Recent developments
## Questions a deep-dive must answer

DEEP-DIVE means the numbers look real and there is a plausible, under-appreciated \
thesis. WATCHLIST means interesting but blocked by price, timing, or one open \
question. PASS means the screen hit is explained away (trap, one-off, governance, \
or simply fully priced)."""


@dataclass
class Memo:
    ticker: str
    name: str
    verdict: str = "ERROR"
    conviction: int | None = None
    one_liner: str = ""
    body: str = ""
    sources: list[tuple[str, str]] = field(default_factory=list)
    model: str = ""
    error: str | None = None
    usage: dict = field(default_factory=dict)


def _fmt(v):
    if v is None or (isinstance(v, float) and v != v):
        return "n/a"
    if isinstance(v, float):
        return f"{v:,.2f}"
    return str(v)


def data_pack(row: dict, screen, universe_label: str) -> str:
    metrics = {k: _fmt(v) for k, v in row.items() if k not in ("summary",)}
    lines = [
        f"Screen: {screen.name}",
        f"Screen description: {screen.description or 'n/a'}",
        f"Universe: {universe_label}",
        "Screen rules: " + ("; ".join(screen.describe_rules()) or "none"),
        "Ranking weights (positive = higher is better): "
        + (json.dumps(screen.rank) if screen.rank else "none"),
        "",
        "Units: *_pct fields are percentages; market_cap_cr is in crore (1e7) of the "
        "listing currency; debt_to_equity, pe, pb are multiples; score is the 0-100 "
        "composite screen rank among the hits.",
        "",
        "Metrics:",
        json.dumps(metrics, indent=2),
    ]
    if row.get("summary"):
        lines += ["", "Data-provider business summary:", str(row["summary"])]
    return "\n".join(lines)


def _parse(text: str, memo: Memo) -> None:
    head, body_lines = {}, []
    for line in text.strip().splitlines():
        m = re.match(r"^\**\s*(VERDICT|CONVICTION|ONE-LINER)\s*:\**\s*(.*)$", line.strip(), re.I)
        if m and not body_lines:
            head[m.group(1).upper()] = m.group(2).strip().strip("*").strip()
        elif head or line.strip():
            body_lines.append(line)
    verdict = head.get("VERDICT", "").upper().replace(" ", "-")
    memo.verdict = next((v for v in VERDICTS if v in verdict), "UNPARSED")
    conv = re.search(r"\d", head.get("CONVICTION", ""))
    memo.conviction = int(conv.group()) if conv else None
    memo.one_liner = head.get("ONE-LINER", "")
    memo.body = "\n".join(body_lines).strip()


class MemoWriter:
    def __init__(self, model: str = DEFAULT_MODEL, effort: str = "medium",
                 web_search: bool = True, max_searches: int = 6, mandate: str = ""):
        self.client = anthropic.Anthropic()
        self.model = model
        self.effort = effort
        self.web_search = web_search
        self.max_searches = max_searches
        self.system = SYSTEM_PROMPT + (f"\n\nFund mandate: {mandate}" if mandate else "")

    def write(self, row: dict, screen, universe_label: str) -> Memo:
        memo = Memo(ticker=row["ticker"], name=row.get("name") or row["ticker"])
        prompt = (
            "Write the first-look memo for this screen hit. Search the web before "
            "you write so the memo reflects the latest results and news.\n\n"
            if self.web_search else
            "Write the first-look memo for this screen hit. Web search is off: work "
            "from the data pack only and say in 'Recent developments' that news was "
            "not checked.\n\n"
        ) + "<data_pack>\n" + data_pack(row, screen, universe_label) + "\n</data_pack>"
        messages = [{"role": "user", "content": prompt}]
        tools = ([{"type": "web_search_20260209", "name": "web_search",
                   "max_uses": self.max_searches}] if self.web_search else [])

        try:
            content = []
            for _ in range(4):  # resume pause_turn a few times at most
                with self.client.beta.messages.stream(
                    model=self.model,
                    max_tokens=64000,
                    system=self.system,
                    messages=messages,
                    tools=tools,
                    thinking={"type": "adaptive"},
                    output_config={"effort": self.effort},
                    betas=["server-side-fallback-2026-07-01"],
                    fallbacks="default",
                ) as stream:
                    resp = stream.get_final_message()
                content.extend(resp.content)
                for k in ("input_tokens", "output_tokens"):
                    memo.usage[k] = memo.usage.get(k, 0) + (getattr(resp.usage, k, 0) or 0)
                if resp.stop_reason != "pause_turn":
                    break
                messages = messages + [{"role": "assistant", "content": resp.content}]
            memo.model = resp.model
        except anthropic.APIStatusError as e:
            memo.error = f"API error {e.status_code}: {e.message}"
            return memo
        except anthropic.APIConnectionError as e:
            memo.error = f"connection error: {e}"
            return memo

        if resp.stop_reason == "refusal":
            memo.error = "model declined to write this memo"
            return memo

        text_parts, sources = [], {}
        for block in content:
            if block.type == "text":
                text_parts.append(block.text)
                for c in getattr(block, "citations", None) or []:
                    url = getattr(c, "url", None)
                    if url:
                        sources.setdefault(url, getattr(c, "title", None) or url)
        _parse("".join(text_parts), memo)
        memo.sources = list(sources.items())
        if resp.stop_reason == "max_tokens":
            memo.error = "memo truncated at max_tokens"
        elif resp.stop_reason == "pause_turn":
            memo.error = "web research did not finish; memo may be incomplete"
        return memo
