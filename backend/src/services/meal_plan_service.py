"""Service for meal planning operations."""

from datetime import datetime, timedelta
from decimal import Decimal
from typing import Any
from uuid import UUID


class MealPlanService:
    """Service for meal plan operations including cost calculation."""

    def calculate_required_ingredients(
        self,
        recipe_ingredients: list[dict[str, Any]],
        recipe_servings: int,
        planned_servings: int,
    ) -> list[dict[str, Any]]:
        """
        Calculate scaled ingredient quantities for planned servings.

        Args:
            recipe_ingredients: List of ingredient dicts with quantity and unit
            recipe_servings: Original recipe serving count
            planned_servings: Desired number of servings

        Returns:
            List of ingredients with scaled quantities
        """
        if recipe_servings <= 0:
            return recipe_ingredients

        scale_factor = Decimal(planned_servings) / Decimal(recipe_servings)

        result = []
        for ing in recipe_ingredients:
            scaled = dict(ing)
            if ing.get("quantity") is not None:
                scaled["quantity"] = ing["quantity"] * scale_factor
            result.append(scaled)

        return result

    def calculate_cost_fifo(
        self,
        lots: list[dict[str, Any]],
        required_quantity: Decimal,
    ) -> dict[str, Any]:
        """
        Calculate cost using FIFO (First In, First Out) from inventory lots.

        Consumes from oldest lots first based on purchase_date.

        Args:
            lots: List of inventory lots with quantity, unit_cost, purchase_date
            required_quantity: Amount needed

        Returns:
            Dict with total_cost, consumed lots, and shortage if insufficient
        """
        # Sort by purchase_date (oldest first for FIFO)
        sorted_lots = sorted(lots, key=lambda x: x.get("purchase_date", datetime.max))

        consumed = []
        total_cost = Decimal("0")
        remaining = required_quantity

        for lot in sorted_lots:
            if remaining <= 0:
                break

            available = lot["quantity"]
            take = min(available, remaining)

            # Calculate unit price (cost per single unit of quantity)
            if lot["quantity"] > 0:
                unit_price = lot["unit_cost"] / lot["quantity"]
            else:
                unit_price = Decimal("0")

            cost = take * unit_price
            total_cost += cost

            consumed.append(
                {
                    "lot_id": lot["id"],
                    "quantity": take,
                    "cost": cost,
                }
            )

            remaining -= take

        result: dict[str, Any] = {
            "total_cost": total_cost,
            "consumed": consumed,
        }

        if remaining > 0:
            result["shortage"] = remaining

        return result

    def create_leftover(
        self,
        household_id: UUID,
        meal_plan_id: UUID,
        recipe_id: UUID,
        servings: int,
        expires_days: int = 3,
    ) -> dict[str, Any]:
        """
        Create leftover data for a cooked meal.

        Args:
            household_id: Household that owns the leftover
            meal_plan_id: Associated meal plan
            recipe_id: Recipe that was cooked
            servings: Number of leftover servings
            expires_days: Days until leftover expires (default 3)

        Returns:
            Leftover data dict ready for persistence
        """
        return {
            "household_id": household_id,
            "meal_plan_id": meal_plan_id,
            "recipe_id": recipe_id,
            "remaining_servings": servings,
            "status": "available",
            "expires_at": datetime.now() + timedelta(days=expires_days),
        }
