# backend/tests/test_unit_converter.py
from decimal import Decimal

from src.services.unit_converter import UnitConverter


class TestUnitConverter:
    def setup_method(self):
        self.converter = UnitConverter()

    def test_convert_kg_to_g(self):
        result = self.converter.to_canonical(Decimal("2"), "kg")
        assert result == (Decimal("2000"), "g")

    def test_convert_dl_to_ml(self):
        result = self.converter.to_canonical(Decimal("5"), "dl")
        assert result == (Decimal("500"), "ml")

    def test_convert_stk_to_pcs(self):
        result = self.converter.to_canonical(Decimal("3"), "stk")
        assert result == (Decimal("3"), "pcs")

    def test_convert_cup_to_ml(self):
        result = self.converter.to_canonical(Decimal("1"), "cup")
        assert result == (Decimal("240"), "ml")

    def test_convert_ss_to_ml(self):
        """Norwegian spiseskje (tablespoon)"""
        result = self.converter.to_canonical(Decimal("2"), "ss")
        assert result == (Decimal("30"), "ml")

    def test_identity_conversion_g(self):
        result = self.converter.to_canonical(Decimal("100"), "g")
        assert result == (Decimal("100"), "g")

    def test_unknown_unit_returns_as_is(self):
        result = self.converter.to_canonical(Decimal("5"), "unknown")
        assert result == (Decimal("5"), "unknown")

    def test_case_insensitive(self):
        result = self.converter.to_canonical(Decimal("1"), "KG")
        assert result == (Decimal("1000"), "g")
