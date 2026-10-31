"""Tests for inventory.py. Run with: python3 -m unittest test_inventory"""
import unittest

from inventory import (
    BadAmount,
    DuplicateSku,
    InsufficientStock,
    InventoryError,
    ParseError,
    UnknownSku,
    find_item,
    low_stock,
    parse_inventory,
    total_units,
    withdraw,
)

SAMPLE = """\
WIDGET-BLUE | Blue widget | 5 | 5
WIDGET-RED  | Red widget  |  0 | 3
GADGET | Gadget | 40 | 10
"""


class ParseInventoryTest(unittest.TestCase):
    def test_parses_fields(self):
        items = parse_inventory(SAMPLE)
        self.assertEqual([i.sku for i in items], ["WIDGET-BLUE", "WIDGET-RED", "GADGET"])
        self.assertEqual(items[0].name, "Blue widget")
        self.assertEqual(items[0].qty, 5)
        self.assertEqual(items[0].reorder_at, 5)

    def test_ignores_blank_and_comment_lines(self):
        items = parse_inventory("# header\n\n   \nGADGET | Gadget | 1 | 0\n")
        self.assertEqual([i.sku for i in items], ["GADGET"])
        self.assertEqual([i.qty for i in items], [1])
        self.assertEqual([i.reorder_at for i in items], [0])

    def test_skus_are_case_sensitive(self):
        items = parse_inventory("a | A | 1 | 0\nA | B | 2 | 0\n")
        self.assertEqual([i.sku for i in items], ["a", "A"])

    def test_empty_input(self):
        self.assertEqual(parse_inventory(""), [])

    def test_parse_errors_report_line_numbers(self):
        cases = [
            ("missing field", "WIDGET | Blue widget | 12\n", 1),
            ("qty not a number", "WIDGET | Blue widget | twelve | 3\n", 1),
            ("qty negative", "WIDGET | Blue widget | -1 | 3\n", 1),
            ("empty sku", "   | Blue widget | 1 | 0\n", 1),
            ("error on later line", "OK | Good | 1 | 0\nW | Bad | x | 0\n", 2),
        ]
        for label, text, line_no in cases:
            with self.subTest(label):
                with self.assertRaises(ParseError) as ctx:
                    parse_inventory(text)
                self.assertEqual(ctx.exception.line_no, line_no)

    def test_duplicate_reported_as_duplicate(self):
        with self.assertRaises(DuplicateSku) as ctx:
            parse_inventory("W | W | 1 | 0\nW | W2 | 1 | 0\n")
        self.assertEqual(ctx.exception.sku, "W")
        self.assertEqual(ctx.exception.line_no, 2)


class QueryTest(unittest.TestCase):
    def setUp(self):
        self.items = parse_inventory(SAMPLE)

    def test_find_item(self):
        self.assertEqual(find_item(self.items, "GADGET").name, "Gadget")

    def test_find_item_missing_returns_none(self):
        self.assertIsNone(find_item(self.items, "NOPE"))

    def test_find_item_is_case_sensitive(self):
        self.assertIsNone(find_item(self.items, "gadget"))

    def test_low_stock_inclusive_in_definition_order(self):
        self.assertEqual([i.sku for i in low_stock(self.items)],
                         ["WIDGET-BLUE", "WIDGET-RED"])

    def test_low_stock_on_empty_inventory(self):
        self.assertEqual(low_stock([]), [])

    def test_total_units(self):
        self.assertEqual(total_units(self.items), 45)


class WithdrawTest(unittest.TestCase):
    def setUp(self):
        self.items = parse_inventory(SAMPLE)

    def test_withdraw_reduces_quantity(self):
        self.assertEqual(withdraw(self.items, "GADGET", 15), 25)

    def test_withdraw_to_zero_is_allowed(self):
        self.assertEqual(withdraw(self.items, "GADGET", 40), 0)

    def test_withdraw_does_not_mutate(self):
        withdraw(self.items, "GADGET", 15)
        self.assertEqual(find_item(self.items, "GADGET").qty, 40)

    def test_withdraw_more_than_available_reports_data(self):
        with self.assertRaises(InsufficientStock) as ctx:
            withdraw(self.items, "GADGET", 41)
        self.assertEqual(ctx.exception.sku, "GADGET")
        self.assertEqual(ctx.exception.amount, 41)
        self.assertEqual(ctx.exception.available, 40)

    def test_withdraw_unknown_sku(self):
        with self.assertRaises(UnknownSku) as ctx:
            withdraw(self.items, "NOPE", 1)
        self.assertEqual(ctx.exception.sku, "NOPE")

    def test_withdraw_rejects_non_positive_amounts(self):
        for amount in (0, -5):
            with self.subTest(amount):
                with self.assertRaises(BadAmount) as ctx:
                    withdraw(self.items, "GADGET", amount)
                self.assertEqual(ctx.exception.amount, amount)

    def test_all_errors_share_the_base_class(self):
        try:
            withdraw(self.items, "NOPE", 1)
        except InventoryError:
            pass
        else:
            self.fail("expected InventoryError")
