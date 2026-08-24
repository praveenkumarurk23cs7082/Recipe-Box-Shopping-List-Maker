"""
Placeholder ingredient parser so the /recipes endpoint works end-to-end
from Day 1, before #2's real parser is ready.

#2: this is your file to replace. Keep the same function signature
(parse_ingredient_line(line: str) -> dict with quantity/unit/name/raw_line
keys) so routers/recipes.py doesn't need to change, and add:
  - fuzzy quantities ("a pinch of salt", "salt to taste") -> quantity=None
  - fraction handling ("1/2 cup") -> convert to float
  - unit normalization (tbsp/tablespoon, etc.)
  - unit tests for the tricky lines above
"""

import re
from typing import Optional, TypedDict


class ParsedIngredient(TypedDict):
    quantity: Optional[float]
    unit: Optional[str]
    name: str
    raw_line: str


_QTY_UNIT_NAME = re.compile(r"^([\d.\/]+)\s+([a-zA-Z]+)\s+(.+)$")
_QTY_NAME = re.compile(r"^([\d.\/]+)\s+(.+)$")


def _to_float(qty_str: str) -> Optional[float]:
    try:
        if "/" in qty_str:
            num, denom = qty_str.split("/")
            return float(num) / float(denom)
        return float(qty_str)
    except (ValueError, ZeroDivisionError):
        return None


def parse_ingredient_line(line: str) -> ParsedIngredient:
    raw_line = line.strip()

    match = _QTY_UNIT_NAME.match(raw_line)
    if match:
        qty_str, unit, name = match.groups()
        return {
            "quantity": _to_float(qty_str),
            "unit": unit,
            "name": name,
            "raw_line": raw_line,
        }

    match = _QTY_NAME.match(raw_line)
    if match:
        qty_str, name = match.groups()
        return {
            "quantity": _to_float(qty_str),
            "unit": None,
            "name": name,
            "raw_line": raw_line,
        }

    # No leading number at all -> can't confidently parse (e.g. "salt to taste").
    # Stored as unscalable, shown as-is in the UI per the shared data model.
    return {"quantity": None, "unit": None, "name": raw_line, "raw_line": raw_line}
