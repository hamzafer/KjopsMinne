# backend/src/schemas/meal_plan.py
"""MealPlan and Leftover Pydantic schemas."""

from datetime import datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from .recipe import RecipeResponse

# Valid meal types that match frontend DayColumn expectations
MealType = Literal["breakfast", "lunch", "dinner"]


# Leftover Schemas
class LeftoverBase(BaseModel):
    """Base schema for leftovers."""

    remaining_servings: int
    status: str = "available"
    expires_at: datetime


class LeftoverCreate(LeftoverBase):
    """Create a new leftover."""

    household_id: UUID
    meal_plan_id: UUID
    recipe_id: UUID


class LeftoverUpdate(BaseModel):
    """Update an existing leftover."""

    status: str | None = None
    remaining_servings: int | None = None


class LeftoverResponse(LeftoverBase):
    """Leftover response."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    household_id: UUID
    meal_plan_id: UUID
    recipe_id: UUID
    created_at: datetime


class LeftoverListResponse(BaseModel):
    """Paginated list of leftovers."""

    leftovers: list[LeftoverResponse]
    total: int


# MealPlan Schemas
class MealPlanBase(BaseModel):
    """Base schema for meal plans."""

    planned_date: datetime
    meal_type: MealType
    servings: int = 2
    is_leftover_source: bool = False


class MealPlanCreate(MealPlanBase):
    """Create a new meal plan."""

    household_id: UUID
    recipe_id: UUID
    leftover_from_id: UUID | None = None


class MealPlanUpdate(BaseModel):
    """Update an existing meal plan."""

    planned_date: datetime | None = None
    meal_type: MealType | None = None
    servings: int | None = None
    status: str | None = None
    is_leftover_source: bool | None = None


class MealPlanResponse(MealPlanBase):
    """Meal plan response."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    household_id: UUID
    recipe_id: UUID
    status: str
    leftover_from_id: UUID | None
    cooked_at: datetime | None
    actual_cost: Decimal | None
    cost_per_serving: Decimal | None
    created_at: datetime
    updated_at: datetime
    recipe: RecipeResponse | None = None


class MealPlanListResponse(BaseModel):
    """Paginated list of meal plans."""

    meal_plans: list[MealPlanResponse]
    total: int


# Cook Action Schemas
class CookRequest(BaseModel):
    """Request to mark a meal as cooked."""

    actual_servings: int | None = None
    create_leftover: bool = False
    leftover_servings: int | None = None


class CookResponse(BaseModel):
    """Response from cooking a meal."""

    meal_plan: MealPlanResponse
    actual_cost: Decimal
    cost_per_serving: Decimal
    inventory_consumed: list[dict]
    leftover: LeftoverResponse | None = None
