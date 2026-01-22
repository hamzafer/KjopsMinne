"""Shopping list generator service."""

from datetime import datetime
from decimal import Decimal
from typing import Any
from uuid import UUID


class ShoppingGenerator:
    """Generate shopping lists from meal plans."""

    def aggregate_ingredients(self, meal_plans: list[dict[str, Any]]) -> dict[UUID, dict[str, Any]]:
        """Aggregate ingredients from multiple meal plans."""
        aggregated: dict[UUID, dict[str, Any]] = {}

        for meal_plan in meal_plans:
            meal_plan_id = meal_plan["id"]
            planned_servings = meal_plan["servings"]
            recipe = meal_plan["recipe"]
            recipe_servings = recipe["servings"]

            scale = (
                Decimal(str(planned_servings)) / Decimal(str(recipe_servings))
                if recipe_servings > 0
                else Decimal("1")
            )

            for ingredient in recipe.get("ingredients", []):
                ingredient_id = ingredient.get("ingredient_id")
                if not ingredient_id:
                    continue

                quantity = Decimal(str(ingredient.get("quantity", 0))) * scale
                unit = ingredient.get("unit", "")

                if ingredient_id not in aggregated:
                    aggregated[ingredient_id] = {
                        "quantity": Decimal("0"),
                        "unit": unit,
                        "source_meal_plans": [],
                    }

                aggregated[ingredient_id]["quantity"] += quantity
                if meal_plan_id not in aggregated[ingredient_id]["source_meal_plans"]:
                    aggregated[ingredient_id]["source_meal_plans"].append(meal_plan_id)

        return aggregated

    def calculate_to_buy(self, required_quantity: Decimal, on_hand_quantity: Decimal) -> Decimal:
        """Calculate quantity to buy."""
        return max(Decimal("0"), required_quantity - on_hand_quantity)

    def generate_list_name(
        self,
        start_date: datetime,
        end_date: datetime,
        custom_name: str | None = None,
    ) -> str:
        """Generate shopping list name."""
        if custom_name:
            return custom_name
        start_str = start_date.strftime("%b %d")
        end_str = end_date.strftime("%b %d")
        return f"Shopping {start_str} - {end_str}"
