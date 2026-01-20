"""Tests for shopping list generator service."""
import pytest
from decimal import Decimal
from datetime import datetime
from uuid import uuid4

from src.services.shopping_generator import ShoppingGenerator


class TestAggregateIngredients:
    def test_aggregate_single_meal_plan(self):
        """Aggregate ingredients from a single meal plan."""
        generator = ShoppingGenerator()
        ing1 = uuid4()
        ing2 = uuid4()

        meal_plans = [
            {
                "id": uuid4(),
                "servings": 2,
                "recipe": {
                    "servings": 2,
                    "ingredients": [
                        {"ingredient_id": ing1, "quantity": Decimal("200"), "unit": "g"},
                        {"ingredient_id": ing2, "quantity": Decimal("2"), "unit": "pcs"},
                    ],
                },
            }
        ]

        result = generator.aggregate_ingredients(meal_plans)

        assert len(result) == 2
        assert result[ing1]["quantity"] == Decimal("200")
        assert result[ing2]["quantity"] == Decimal("2")

    def test_aggregate_multiple_meal_plans_same_ingredient(self):
        """Aggregate same ingredient from multiple meal plans."""
        generator = ShoppingGenerator()
        ingredient_id = uuid4()

        meal_plans = [
            {
                "id": uuid4(),
                "servings": 2,
                "recipe": {
                    "servings": 2,
                    "ingredients": [
                        {"ingredient_id": ingredient_id, "quantity": Decimal("100"), "unit": "g"},
                    ],
                },
            },
            {
                "id": uuid4(),
                "servings": 2,
                "recipe": {
                    "servings": 2,
                    "ingredients": [
                        {"ingredient_id": ingredient_id, "quantity": Decimal("150"), "unit": "g"},
                    ],
                },
            },
        ]

        result = generator.aggregate_ingredients(meal_plans)

        assert len(result) == 1
        assert result[ingredient_id]["quantity"] == Decimal("250")

    def test_aggregate_scales_by_servings(self):
        """Scale ingredients by planned vs recipe servings."""
        generator = ShoppingGenerator()
        ingredient_id = uuid4()

        meal_plans = [
            {
                "id": uuid4(),
                "servings": 4,
                "recipe": {
                    "servings": 2,
                    "ingredients": [
                        {"ingredient_id": ingredient_id, "quantity": Decimal("100"), "unit": "g"},
                    ],
                },
            },
        ]

        result = generator.aggregate_ingredients(meal_plans)

        assert result[ingredient_id]["quantity"] == Decimal("200")

    def test_aggregate_tracks_source_meal_plans(self):
        """Track which meal plans require each ingredient."""
        generator = ShoppingGenerator()
        ingredient_id = uuid4()
        meal_plan_id_1 = uuid4()
        meal_plan_id_2 = uuid4()

        meal_plans = [
            {
                "id": meal_plan_id_1,
                "servings": 2,
                "recipe": {
                    "servings": 2,
                    "ingredients": [
                        {"ingredient_id": ingredient_id, "quantity": Decimal("100"), "unit": "g"},
                    ],
                },
            },
            {
                "id": meal_plan_id_2,
                "servings": 2,
                "recipe": {
                    "servings": 2,
                    "ingredients": [
                        {"ingredient_id": ingredient_id, "quantity": Decimal("50"), "unit": "g"},
                    ],
                },
            },
        ]

        result = generator.aggregate_ingredients(meal_plans)

        assert meal_plan_id_1 in result[ingredient_id]["source_meal_plans"]
        assert meal_plan_id_2 in result[ingredient_id]["source_meal_plans"]


class TestCalculateToBuy:
    def test_calculate_to_buy_no_inventory(self):
        """Calculate to buy when no inventory exists."""
        generator = ShoppingGenerator()
        result = generator.calculate_to_buy(Decimal("500"), Decimal("0"))
        assert result == Decimal("500")

    def test_calculate_to_buy_partial_inventory(self):
        """Calculate to buy when some inventory exists."""
        generator = ShoppingGenerator()
        result = generator.calculate_to_buy(Decimal("500"), Decimal("200"))
        assert result == Decimal("300")

    def test_calculate_to_buy_sufficient_inventory(self):
        """Calculate to buy when inventory is sufficient."""
        generator = ShoppingGenerator()
        result = generator.calculate_to_buy(Decimal("500"), Decimal("600"))
        assert result == Decimal("0")

    def test_calculate_to_buy_exact_inventory(self):
        """Calculate to buy when inventory exactly matches."""
        generator = ShoppingGenerator()
        result = generator.calculate_to_buy(Decimal("500"), Decimal("500"))
        assert result == Decimal("0")


class TestGenerateListName:
    def test_generate_name_default(self):
        """Generate default list name from date range."""
        generator = ShoppingGenerator()
        result = generator.generate_list_name(
            start_date=datetime(2026, 1, 20),
            end_date=datetime(2026, 1, 26),
        )
        assert "Jan 20" in result
        assert "Jan 26" in result

    def test_generate_name_custom(self):
        """Use custom name if provided."""
        generator = ShoppingGenerator()
        result = generator.generate_list_name(
            start_date=datetime(2026, 1, 20),
            end_date=datetime(2026, 1, 26),
            custom_name="Weekly groceries",
        )
        assert result == "Weekly groceries"
