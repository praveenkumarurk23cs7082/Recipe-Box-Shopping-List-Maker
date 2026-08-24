"""
Robust ingredient parser for extracting quantity, unit, and name from a raw text line.
Supports:
  - Numeric formats (integers, decimals, slash fractions like '1/2', mixed numbers like '1 1/2')
  - Unicode fractions (½, ¼, ¾, etc.)
  - Unit normalization (e.g., tablespoons/tbsp/tbsp. -> tbsp)
  - Fuzzy / non-scalable fallbacks (e.g., 'a pinch of salt' -> quantity=None)
"""

import re
from typing import Optional, TypedDict


class ParsedIngredient(TypedDict):
    quantity: Optional[float]
    unit: Optional[str]
    name: str
    raw_line: str


# Mapping of unicode fractions to float values
UNICODE_FRACTIONS = {
    "½": 0.5,
    "¼": 0.25,
    "¾": 0.75,
    "⅓": 0.333,
    "⅔": 0.667,
    "⅛": 0.125,
    "⅜": 0.375,
    "⅝": 0.625,
    "⅞": 0.875,
}

# Unit normalization map
UNIT_MAP = {
    "cup": "cup", "cups": "cup",
    "tbsp": "tbsp", "tbsps": "tbsp", "tablespoon": "tbsp", "tablespoons": "tbsp",
    "tsp": "tsp", "tsps": "tsp", "teaspoon": "tsp", "teaspoons": "tsp",
    "oz": "oz", "ozs": "oz", "ounce": "oz", "ounces": "oz",
    "lb": "lb", "lbs": "lb", "pound": "lb", "pounds": "lb",
    "g": "g", "gram": "g", "grams": "g",
    "kg": "kg", "kilogram": "kg", "kilograms": "kg",
    "ml": "ml", "milliliter": "ml", "milliliters": "ml",
    "l": "l", "liter": "l", "liters": "l",
    "clove": "clove", "cloves": "clove",
    "pinch": "pinch", "pinches": "pinch",
    "can": "can", "cans": "can",
    "slice": "slice", "slices": "slice",
    "package": "package", "packages": "package", "pkg": "package", "pkgs": "package"
}

# Regex to detect starting numeric values (including mixed numbers, unicode fractions, and slash fractions)
_QTY_PATTERN = re.compile(
    r"^(?:"
    r"(\d+)\s+([½¼¾⅓⅔⅛⅜⅝⅞])"  # Group 1, 2: Mixed unicode number (e.g. "1 ½")
    r"|(\d+)\s+(\d+/\d+)"     # Group 3, 4: Mixed slash fraction (e.g. "1 1/2")
    r"|([½¼¾⅓⅔⅛⅜⅝⅞])"          # Group 5: Standalone unicode fraction (e.g. "½")
    r"|(\d+/\d+)"             # Group 6: Standalone slash fraction (e.g. "1/2")
    r"|(\d+(?:\.\d+)?)"        # Group 7: Integer or decimal float (e.g. "1.5", "2")
    r")\s*(.*)$"              # Group 8: The remaining text after the quantity
)


def _parse_qty(match) -> Optional[float]:
    # Group 1 & 2: mixed unicode fraction (e.g., "1 ½")
    if match.group(1) and match.group(2):
        whole = float(match.group(1))
        frac = UNICODE_FRACTIONS[match.group(2)]
        return whole + frac

    # Group 3 & 4: mixed slash fraction (e.g., "1 1/2")
    if match.group(3) and match.group(4):
        whole = float(match.group(3))
        num, denom = match.group(4).split("/")
        return whole + (float(num) / float(denom))

    # Group 5: standalone unicode fraction (e.g., "½")
    if match.group(5):
        return UNICODE_FRACTIONS[match.group(5)]

    # Group 6: standalone slash fraction (e.g., "1/2")
    if match.group(6):
        num, denom = match.group(6).split("/")
        return float(num) / float(denom)

    # Group 7: integer or decimal float (e.g., "2", "1.5")
    if match.group(7):
        return float(match.group(7))

    return None


def parse_ingredient_line(line: str) -> ParsedIngredient:
    raw_line = line.strip()
    if not raw_line:
        return {"quantity": None, "unit": None, "name": "", "raw_line": ""}

    match = _QTY_PATTERN.match(raw_line)
    if not match:
        # Fuzzy line (no leading number, e.g. "salt to taste") -> unscalable
        return {"quantity": None, "unit": None, "name": raw_line, "raw_line": raw_line}

    qty = _parse_qty(match)
    rest = match.group(8).strip() if match.group(8) else ""

    if not rest:
        # Input was just a quantity (e.g., "2")
        return {"quantity": qty, "unit": None, "name": "", "raw_line": raw_line}

    # Split rest into first word and the remainder
    words = rest.split(maxsplit=1)
    first_word = words[0]
    
    # Strip common punctuation from the end of the first word (like dots in "tbsp.")
    clean_first_word = first_word.rstrip(".,;:").lower()

    if clean_first_word in UNIT_MAP:
        unit = UNIT_MAP[clean_first_word]
        name = words[1].strip() if len(words) > 1 else ""
        return {
            "quantity": qty,
            "unit": unit,
            "name": name,
            "raw_line": raw_line,
        }

    # First word is not a unit (e.g. "2 eggs")
    return {
        "quantity": qty,
        "unit": None,
        "name": rest,
        "raw_line": raw_line,
    }

