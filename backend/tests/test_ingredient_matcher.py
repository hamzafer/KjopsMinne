# backend/tests/test_ingredient_matcher.py
import pytest
from decimal import Decimal
from unittest.mock import MagicMock
import uuid

from src.services.ingredient_matcher import IngredientMatcher


class TestIngredientMatcher:
    def setup_method(self):
        self.matcher = IngredientMatcher()

    def test_normalize_removes_weight_suffix(self):
        result = self.matcher.normalize_name("TOMAT 500G")
        assert result == "tomat"

    def test_normalize_removes_brand_prefix(self):
        result = self.matcher.normalize_name("TINE MELK 1L")
        assert result == "melk"

    def test_normalize_handles_quantity_prefix(self):
        result = self.matcher.normalize_name("2X YOGHURT")
        assert result == "yoghurt"

    def test_normalize_norwegian_characters(self):
        result = self.matcher.normalize_name("RØKT LAKS")
        assert result == "rokt laks"

    def test_exact_match_returns_high_confidence(self):
        # Mock ingredient with canonical_name "melk"
        ingredient = MagicMock()
        ingredient.id = uuid.uuid4()
        ingredient.name = "Melk"
        ingredient.canonical_name = "melk"
        ingredient.aliases = ["milk"]

        result = self.matcher.match_against_ingredient("melk", ingredient)
        assert result is not None
        assert result.confidence == Decimal("1.0")
        assert result.method == "exact"

    def test_alias_match_returns_good_confidence(self):
        ingredient = MagicMock()
        ingredient.id = uuid.uuid4()
        ingredient.name = "Melk"
        ingredient.canonical_name = "melk"
        ingredient.aliases = ["milk", "helmelk", "lettmelk"]

        result = self.matcher.match_against_ingredient("lettmelk", ingredient)
        assert result is not None
        assert result.confidence == Decimal("0.95")
        assert result.method == "alias"

    def test_fuzzy_match_substring(self):
        ingredient = MagicMock()
        ingredient.id = uuid.uuid4()
        ingredient.name = "Kyllingfilet"
        ingredient.canonical_name = "kyllingfilet"
        ingredient.aliases = ["chicken breast", "kylling"]

        result = self.matcher.match_against_ingredient("kylling", ingredient)
        assert result is not None
        assert result.confidence >= Decimal("0.8")
        assert result.method in ("alias", "fuzzy")

    def test_no_match_returns_none(self):
        ingredient = MagicMock()
        ingredient.id = uuid.uuid4()
        ingredient.name = "Melk"
        ingredient.canonical_name = "melk"
        ingredient.aliases = ["milk"]

        result = self.matcher.match_against_ingredient("sjokolade", ingredient)
        assert result is None

    @pytest.mark.asyncio
    async def test_match_returns_best_result(self):
        ingredient1 = MagicMock()
        ingredient1.id = uuid.uuid4()
        ingredient1.name = "Melk"
        ingredient1.canonical_name = "melk"
        ingredient1.aliases = []

        result = await self.matcher.match("TINE MELK 1L", [ingredient1])
        assert result is not None
        assert result.method == "exact"
