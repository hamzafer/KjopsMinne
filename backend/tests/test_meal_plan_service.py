"""Tests for meal plan service."""

from datetime import datetime, timedelta
from decimal import Decimal
from uuid import uuid4

from src.services.meal_plan_service import MealPlanService


class TestCalculateRequiredIngredients:
    """Tests for ingredient scaling calculations."""

    def setup_method(self):
        self.service = MealPlanService()

    def test_scale_ingredients_double_servings(self):
        """Calculate scaled ingredients when doubling servings."""
        ingredient_id_1 = uuid4()
        ingredient_id_2 = uuid4()
        recipe_ingredients = [
            {"ingredient_id": ingredient_id_1, "quantity": Decimal("200"), "unit": "g"},
            {"ingredient_id": ingredient_id_2, "quantity": Decimal("2"), "unit": "pcs"},
        ]

        result = self.service.calculate_required_ingredients(
            recipe_ingredients=recipe_ingredients,
            recipe_servings=2,
            planned_servings=4,
        )

        # Should double (4 servings vs 2 recipe servings)
        assert result[0]["quantity"] == Decimal("400")
        assert result[1]["quantity"] == Decimal("4")
        # Original ingredient IDs preserved
        assert result[0]["ingredient_id"] == ingredient_id_1
        assert result[1]["ingredient_id"] == ingredient_id_2

    def test_scale_ingredients_same_servings(self):
        """No scaling when servings match."""
        recipe_ingredients = [
            {"ingredient_id": uuid4(), "quantity": Decimal("100"), "unit": "g"},
        ]

        result = self.service.calculate_required_ingredients(
            recipe_ingredients=recipe_ingredients,
            recipe_servings=2,
            planned_servings=2,
        )

        assert result[0]["quantity"] == Decimal("100")

    def test_scale_ingredients_half_servings(self):
        """Halve ingredients when making half servings."""
        recipe_ingredients = [
            {"ingredient_id": uuid4(), "quantity": Decimal("300"), "unit": "g"},
        ]

        result = self.service.calculate_required_ingredients(
            recipe_ingredients=recipe_ingredients,
            recipe_servings=4,
            planned_servings=2,
        )

        assert result[0]["quantity"] == Decimal("150")

    def test_scale_ingredients_preserves_unit(self):
        """Unit should be preserved after scaling."""
        recipe_ingredients = [
            {"ingredient_id": uuid4(), "quantity": Decimal("500"), "unit": "ml"},
        ]

        result = self.service.calculate_required_ingredients(
            recipe_ingredients=recipe_ingredients,
            recipe_servings=2,
            planned_servings=4,
        )

        assert result[0]["unit"] == "ml"

    def test_scale_ingredients_zero_recipe_servings(self):
        """Return unchanged when recipe servings is zero (edge case)."""
        recipe_ingredients = [
            {"ingredient_id": uuid4(), "quantity": Decimal("100"), "unit": "g"},
        ]

        result = self.service.calculate_required_ingredients(
            recipe_ingredients=recipe_ingredients,
            recipe_servings=0,
            planned_servings=4,
        )

        # Should return unchanged to avoid division by zero
        assert result[0]["quantity"] == Decimal("100")

    def test_scale_ingredients_empty_list(self):
        """Handle empty ingredient list."""
        result = self.service.calculate_required_ingredients(
            recipe_ingredients=[],
            recipe_servings=2,
            planned_servings=4,
        )

        assert result == []


class TestCalculateCostFifo:
    """Tests for FIFO cost calculation."""

    def setup_method(self):
        self.service = MealPlanService()

    def test_calculate_cost_from_single_lot(self):
        """Calculate cost when one lot is sufficient."""
        lots = [
            {
                "id": uuid4(),
                "quantity": Decimal("100"),
                "unit_cost": Decimal("10.00"),
                "purchase_date": datetime.now() - timedelta(days=1),
            },
        ]

        result = self.service.calculate_cost_fifo(
            lots=lots,
            required_quantity=Decimal("50"),
        )

        # 50g at 10kr/100g = 5kr
        assert result["total_cost"] == Decimal("5.00")
        assert len(result["consumed"]) == 1
        assert result["consumed"][0]["quantity"] == Decimal("50")

    def test_calculate_cost_fifo_multiple_lots(self):
        """Calculate cost using FIFO from multiple lots."""
        lot_id_1 = uuid4()
        lot_id_2 = uuid4()
        lots = [
            {
                "id": lot_id_1,
                "quantity": Decimal("100"),
                "unit_cost": Decimal("10.00"),
                "purchase_date": datetime.now() - timedelta(days=2),  # Older
            },
            {
                "id": lot_id_2,
                "quantity": Decimal("100"),
                "unit_cost": Decimal("15.00"),
                "purchase_date": datetime.now() - timedelta(days=1),  # Newer
            },
        ]

        # Need 150g - take 100g @ 10kr + 50g @ 15kr
        result = self.service.calculate_cost_fifo(
            lots=lots,
            required_quantity=Decimal("150"),
        )

        # 100g * 0.10kr/g + 50g * 0.15kr/g = 10.00 + 7.50 = 17.50
        assert result["total_cost"] == Decimal("17.50")
        assert len(result["consumed"]) == 2
        # First lot (older) consumed fully
        assert result["consumed"][0]["lot_id"] == lot_id_1
        assert result["consumed"][0]["quantity"] == Decimal("100")
        # Second lot partially consumed
        assert result["consumed"][1]["lot_id"] == lot_id_2
        assert result["consumed"][1]["quantity"] == Decimal("50")

    def test_calculate_cost_insufficient_inventory(self):
        """Handle insufficient inventory with shortage."""
        lots = [
            {
                "id": uuid4(),
                "quantity": Decimal("50"),
                "unit_cost": Decimal("10.00"),
                "purchase_date": datetime.now(),
            },
        ]

        result = self.service.calculate_cost_fifo(
            lots=lots,
            required_quantity=Decimal("100"),
        )

        assert result["shortage"] == Decimal("50")
        # Still calculates cost for what's available
        assert result["total_cost"] == Decimal("10.00")

    def test_calculate_cost_exact_quantity(self):
        """Calculate cost when exact quantity available."""
        lots = [
            {
                "id": uuid4(),
                "quantity": Decimal("100"),
                "unit_cost": Decimal("25.00"),
                "purchase_date": datetime.now(),
            },
        ]

        result = self.service.calculate_cost_fifo(
            lots=lots,
            required_quantity=Decimal("100"),
        )

        assert result["total_cost"] == Decimal("25.00")
        assert "shortage" not in result

    def test_calculate_cost_empty_lots(self):
        """Handle empty lots list."""
        result = self.service.calculate_cost_fifo(
            lots=[],
            required_quantity=Decimal("100"),
        )

        assert result["total_cost"] == Decimal("0")
        assert result["shortage"] == Decimal("100")
        assert result["consumed"] == []

    def test_calculate_cost_fifo_order_matters(self):
        """Verify FIFO order: oldest first regardless of list order."""
        old_lot_id = uuid4()
        new_lot_id = uuid4()
        # Newer lot listed first in array
        lots = [
            {
                "id": new_lot_id,
                "quantity": Decimal("100"),
                "unit_cost": Decimal("20.00"),
                "purchase_date": datetime.now() - timedelta(days=1),
            },
            {
                "id": old_lot_id,
                "quantity": Decimal("100"),
                "unit_cost": Decimal("10.00"),
                "purchase_date": datetime.now() - timedelta(days=5),  # Older
            },
        ]

        result = self.service.calculate_cost_fifo(
            lots=lots,
            required_quantity=Decimal("50"),
        )

        # Should use older lot first
        assert result["consumed"][0]["lot_id"] == old_lot_id
        assert result["total_cost"] == Decimal("5.00")  # 50 * 0.10


class TestCreateLeftover:
    """Tests for leftover creation."""

    def setup_method(self):
        self.service = MealPlanService()

    def test_create_leftover_basic(self):
        """Create leftover data with default expiry."""
        household_id = uuid4()
        meal_plan_id = uuid4()
        recipe_id = uuid4()

        result = self.service.create_leftover(
            household_id=household_id,
            meal_plan_id=meal_plan_id,
            recipe_id=recipe_id,
            servings=2,
        )

        assert result["remaining_servings"] == 2
        assert result["status"] == "available"
        assert result["household_id"] == household_id
        assert result["meal_plan_id"] == meal_plan_id
        assert result["recipe_id"] == recipe_id

    def test_create_leftover_custom_expiry(self):
        """Create leftover with custom expiry days."""
        result = self.service.create_leftover(
            household_id=uuid4(),
            meal_plan_id=uuid4(),
            recipe_id=uuid4(),
            servings=3,
            expires_days=5,
        )

        assert result["remaining_servings"] == 3
        # Expires_at should be approximately 5 days from now
        expected_min = datetime.now() + timedelta(days=4, hours=23)
        expected_max = datetime.now() + timedelta(days=5, hours=1)
        assert expected_min <= result["expires_at"] <= expected_max

    def test_create_leftover_has_expires_at(self):
        """Leftover should have expires_at timestamp."""
        result = self.service.create_leftover(
            household_id=uuid4(),
            meal_plan_id=uuid4(),
            recipe_id=uuid4(),
            servings=1,
            expires_days=3,
        )

        assert "expires_at" in result
        # Default 3 days expiry
        expected_min = datetime.now() + timedelta(days=2, hours=23)
        expected_max = datetime.now() + timedelta(days=3, hours=1)
        assert expected_min <= result["expires_at"] <= expected_max
