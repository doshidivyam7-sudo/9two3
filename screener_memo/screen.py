"""Quant screen: hard filters, then a weighted percentile-rank score."""

from __future__ import annotations

import tomllib
from dataclasses import dataclass, field
from pathlib import Path

import pandas as pd

from .data import NUMERIC_FIELDS


@dataclass
class Screen:
    name: str
    description: str = ""
    top_n: int = 10
    filters: dict[str, dict] = field(default_factory=dict)
    rank: dict[str, float] = field(default_factory=dict)
    exclude_sectors: list[str] = field(default_factory=list)
    mandate: str = ""

    @classmethod
    def load(cls, path: str | Path) -> "Screen":
        cfg = tomllib.loads(Path(path).read_text())
        screen = cls(
            name=cfg.get("name", Path(path).stem),
            description=cfg.get("description", ""),
            top_n=int(cfg.get("top_n", 10)),
            filters=cfg.get("filters", {}),
            rank=cfg.get("rank", {}),
            exclude_sectors=cfg.get("exclude_sectors", []),
            mandate=cfg.get("memo", {}).get("mandate", ""),
        )
        for f in [*screen.filters, *screen.rank]:
            if f not in NUMERIC_FIELDS:
                raise ValueError(f"{path}: unknown metric '{f}'. Known: {', '.join(NUMERIC_FIELDS)}")
        return screen

    def describe_rules(self) -> list[str]:
        rules = []
        for metric, spec in self.filters.items():
            parts = []
            if "min" in spec:
                parts.append(f">= {spec['min']}")
            if "max" in spec:
                parts.append(f"<= {spec['max']}")
            rules.append(f"{metric} {' and '.join(parts)}")
        if self.exclude_sectors:
            rules.append(f"sector not in {self.exclude_sectors}")
        return rules


def run_screen(df: pd.DataFrame, screen: Screen, top_n: int | None = None) -> pd.DataFrame:
    """Return the passing rows, best first, with a 0-100 `score` column.

    A missing value fails its filter unless the filter sets allow_missing = true.
    In ranking, a missing value scores a neutral 0.5 percentile.
    """
    df = df.copy()
    mask = pd.Series(True, index=df.index)
    for metric, spec in screen.filters.items():
        col = df[metric]
        ok = pd.Series(True, index=df.index)
        if "min" in spec:
            ok &= col >= spec["min"]
        if "max" in spec:
            ok &= col <= spec["max"]
        if spec.get("allow_missing"):
            ok |= col.isna()
        else:
            ok &= col.notna()
        mask &= ok
    if screen.exclude_sectors:
        excluded = {s.lower() for s in screen.exclude_sectors}
        mask &= ~df["sector"].fillna("").str.lower().isin(excluded)

    passed = df[mask].copy()
    total_weight = sum(abs(w) for w in screen.rank.values()) or 1.0
    score = pd.Series(0.0, index=passed.index)
    for metric, weight in screen.rank.items():
        pr = passed[metric].rank(pct=True, ascending=weight > 0).fillna(0.5)
        score += abs(weight) * pr
    passed["score"] = (score / total_weight * 100).round(1)
    passed = passed.sort_values("score", ascending=False)
    n = top_n if top_n is not None else screen.top_n
    return passed.head(n).reset_index(drop=True)
