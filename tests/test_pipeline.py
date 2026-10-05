"""Offline tests: synthetic fixtures and a fake Claude client, no network."""

from pathlib import Path
from types import SimpleNamespace

import pandas as pd
import pytest

from screener_memo import cli, memo as memo_mod
from screener_memo.data import load_csv
from screener_memo.screen import Screen, run_screen

HERE = Path(__file__).parent
SCREEN = HERE.parent / "screens" / "quality_value.toml"


def test_csv_aliases_map_screener_columns():
    df = load_csv(HERE / "fixtures.csv")
    alpha = df.set_index("ticker").loc["ALPHA"]
    assert alpha["name"] == "Alpha Widgets"
    assert alpha["market_cap_cr"] == 12000
    assert alpha["roe_pct"] == 22
    assert alpha["debt_to_equity"] == 0.1
    assert alpha["revenue_growth_pct"] == 15


def test_filters_and_ranking():
    df = load_csv(HERE / "fixtures.csv")
    hits = run_screen(df, Screen.load(SCREEN))
    # BETA fails P/E, GAMMA fails ROE/debt, EPS fails market cap.
    # DELTA has no D/E but that filter allows missing.
    assert set(hits["ticker"]) == {"ALPHA", "DELTA", "ZETA"}
    assert hits["score"].is_monotonic_decreasing
    assert hits["score"].between(0, 100).all()


def test_missing_value_fails_unless_allowed():
    df = pd.DataFrame({"ticker": ["A", "B"], "roe_pct": [20.0, None]})
    df = load_csv_like(df)
    s = Screen(name="t", filters={"roe_pct": {"min": 15}})
    assert list(run_screen(df, s)["ticker"]) == ["A"]
    s.filters["roe_pct"]["allow_missing"] = True
    assert set(run_screen(df, s)["ticker"]) == {"A", "B"}


def test_unknown_metric_rejected(tmp_path):
    bad = tmp_path / "bad.toml"
    bad.write_text('name = "x"\n[filters]\nroe = { min = 1 }\n')
    with pytest.raises(ValueError, match="unknown metric"):
        Screen.load(bad)


def load_csv_like(df):
    from screener_memo.data import _normalise
    return _normalise(df)


# ------------------------------------------------------------ memo writer --

MEMO_TEXT = """VERDICT: DEEP-DIVE
CONVICTION: 4
ONE-LINER: Under-owned cable maker compounding at 25% with a clean balance sheet.

## Why it screened
High ROE and growth.
"""


class FakeStream:
    def __init__(self, resp):
        self.resp = resp

    def __enter__(self):
        return self

    def __exit__(self, *a):
        return False

    def get_final_message(self):
        return self.resp


class FakeClient:
    def __init__(self, responses):
        self.responses = list(responses)
        self.calls = []
        self.beta = SimpleNamespace(messages=SimpleNamespace(stream=self._stream))

    def _stream(self, **kwargs):
        self.calls.append(kwargs)
        return FakeStream(self.responses.pop(0))


def _resp(text, stop="end_turn", citations=()):
    block = SimpleNamespace(type="text", text=text, citations=list(citations))
    return SimpleNamespace(content=[block], stop_reason=stop, model="claude-opus-5-5",
                           usage=SimpleNamespace(input_tokens=100, output_tokens=50))


def _writer(responses, **kw):
    w = memo_mod.MemoWriter.__new__(memo_mod.MemoWriter)
    w.client = FakeClient(responses)
    w.model, w.effort, w.web_search, w.max_searches = "claude-opus-5-5", "medium", True, 6
    w.system = memo_mod.SYSTEM_PROMPT
    w.__dict__.update(kw)
    return w


ROW = {"ticker": "ZETA", "name": "Zeta Cables", "score": 80.0, "roe_pct": 19.0, "summary": "Makes cables."}


def test_memo_parsed_and_request_shape():
    cite = SimpleNamespace(url="https://example.com/q2", title="Q2 results")
    w = _writer([_resp(MEMO_TEXT, citations=[cite])])
    m = w.write(ROW, Screen(name="t"), "fixtures.csv")
    assert (m.verdict, m.conviction) == ("DEEP-DIVE", 4)
    assert m.one_liner.startswith("Under-owned cable maker")
    assert m.body.startswith("## Why it screened")
    assert m.sources == [("https://example.com/q2", "Q2 results")]
    call = w.client.calls[0]
    assert call["model"] == "claude-opus-5-5"
    assert call["fallbacks"] == "default"
    assert call["tools"][0]["type"] == "web_search_20260209"
    assert "<data_pack>" in call["messages"][0]["content"]


def test_pause_turn_resumes():
    first = _resp("")
    first.stop_reason = "pause_turn"
    w = _writer([first, _resp(MEMO_TEXT)])
    m = w.write(ROW, Screen(name="t"), "u")
    assert m.verdict == "DEEP-DIVE" and m.error is None
    assert len(w.client.calls) == 2
    assert w.client.calls[1]["messages"][-1]["role"] == "assistant"


def test_refusal_recorded_as_error():
    w = _writer([_resp("", stop="refusal")])
    m = w.write(ROW, Screen(name="t"), "u")
    assert m.verdict == "ERROR" and "declined" in m.error


def test_end_to_end_with_fake_client(tmp_path, monkeypatch):
    monkeypatch.setattr(memo_mod.anthropic, "Anthropic",
                        lambda: FakeClient([_resp(MEMO_TEXT) for _ in range(10)]))
    rc = cli.main(["--screen", str(SCREEN), "--csv", str(HERE / "fixtures.csv"),
                   "--out", str(tmp_path), "--workers", "1"])
    assert rc == 0
    run_dir = next(tmp_path.iterdir())
    index = (run_dir / "index.md").read_text()
    assert "3 passed the filters" in index and "[ZETA](memos/ZETA.md)" in index
    assert (run_dir / "memos" / "ALPHA.md").read_text().startswith("# Alpha Widgets (ALPHA)")
    assert (run_dir / "screen_results.csv").exists()


def test_dry_run_writes_data_packs(tmp_path):
    rc = cli.main(["--screen", str(SCREEN), "--csv", str(HERE / "fixtures.csv"),
                   "--out", str(tmp_path), "--dry-run"])
    assert rc == 0
    packs = list(next(tmp_path.iterdir()).glob("memos/*.datapack.txt"))
    assert len(packs) == 3
