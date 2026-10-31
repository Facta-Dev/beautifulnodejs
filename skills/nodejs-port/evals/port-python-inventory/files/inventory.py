"""Parse a small stock-inventory format and answer stock questions.

Format, one item per line:

    SKU | Name | qty | reorder_at

`qty` and `reorder_at` are non-negative integers. Lines starting with '#'
and blank lines are ignored. SKUs are unique and case-sensitive.
"""

MIN_LEVEL = 0


class InventoryError(Exception):
    """Base class for every error this module raises."""


class ParseError(InventoryError):
    def __init__(self, line_no, message):
        super().__init__(f"line {line_no}: {message}")
        self.line_no = line_no


class DuplicateSku(InventoryError):
    def __init__(self, line_no, sku):
        super().__init__(f"line {line_no}: duplicate sku {sku}")
        self.line_no = line_no
        self.sku = sku


class UnknownSku(InventoryError):
    def __init__(self, sku):
        super().__init__(f"unknown sku {sku}")
        self.sku = sku


class BadAmount(InventoryError):
    def __init__(self, sku, amount):
        super().__init__(f"{sku}: amount must be positive, got {amount}")
        self.sku = sku
        self.amount = amount


class InsufficientStock(InventoryError):
    def __init__(self, sku, amount, available):
        super().__init__(f"{sku}: cannot withdraw {amount}, only {available} in stock")
        self.sku = sku
        self.amount = amount
        self.available = available


class Item:
    def __init__(self, sku, name, qty, reorder_at):
        self.sku = sku
        self.name = name
        self.qty = qty
        self.reorder_at = reorder_at

    def __repr__(self):
        return f"Item({self.sku!r}, {self.name!r}, qty={self.qty}, reorder_at={self.reorder_at})"


def _parse_level(text, line_no, field):
    try:
        value = int(text)
    except ValueError:
        raise ParseError(line_no, f"{field} is not an integer: {text!r}") from None
    if value < MIN_LEVEL:
        raise ParseError(line_no, f"{field} is negative: {value}")
    return value


def parse_inventory(text):
    """Parse the inventory format, preserving definition order."""
    items = []
    seen = set()
    for line_no, raw in enumerate(text.splitlines(), start=1):
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        parts = [p.strip() for p in line.split("|")]
        if len(parts) != 4:
            raise ParseError(line_no, f"expected 'SKU | Name | qty | reorder_at', got {raw!r}")
        sku, name, qty_text, reorder_text = parts
        if not sku:
            raise ParseError(line_no, "empty sku")
        if not name:
            raise ParseError(line_no, "empty name")
        qty = _parse_level(qty_text, line_no, "qty")
        reorder_at = _parse_level(reorder_text, line_no, "reorder_at")
        if sku in seen:
            raise DuplicateSku(line_no, sku)
        seen.add(sku)
        items.append(Item(sku, name, qty, reorder_at))
    return items


def find_item(items, sku):
    """Return the item with this sku, or None."""
    for item in items:
        if item.sku == sku:
            return item
    return None


def low_stock(items):
    """Return items with qty <= reorder_at, in definition order."""
    return [item for item in items if item.qty <= item.reorder_at]


def total_units(items):
    """Return the sum of every item's qty."""
    return sum(item.qty for item in items)


def withdraw(items, sku, amount):
    """Return the item's remaining qty after withdrawing `amount` units.

    The list is not mutated. Raises UnknownSku for a missing sku, BadAmount
    for a non-positive amount, and InsufficientStock when the amount exceeds
    the available qty.
    """
    if not isinstance(amount, int) or isinstance(amount, bool):
        raise BadAmount(sku, amount)
    if amount <= 0:
        raise BadAmount(sku, amount)
    item = find_item(items, sku)
    if item is None:
        raise UnknownSku(sku)
    if amount > item.qty:
        raise InsufficientStock(sku, amount, item.qty)
    return item.qty - amount
