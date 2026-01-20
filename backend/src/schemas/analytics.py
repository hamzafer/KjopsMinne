"""Pydantic schemas for extended analytics."""
from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel


# Cost Per Meal Analytics
class MealCostEntry(BaseModel):
    meal_plan_id: UUID
    recipe_name: str
    planned_date: datetime
    servings: int
    actual_cost: Decimal
    cost_per_serving: Decimal


class CostPerMealResponse(BaseModel):
    meals: list[MealCostEntry]
    total_meals: int
    total_cost: Decimal
    average_cost_per_meal: Decimal
    average_cost_per_serving: Decimal
    period_start: datetime | None
    period_end: datetime | None


# Waste Analytics
class WasteEntry(BaseModel):
    date: datetime
    ingredient_name: str | None
    quantity: Decimal
    unit: str
    reason: str
    estimated_value: Decimal | None


class LeftoverWasteEntry(BaseModel):
    leftover_id: UUID
    recipe_name: str
    servings_wasted: int
    created_at: datetime
    discarded_at: datetime | None


class WasteResponse(BaseModel):
    inventory_discards: list[WasteEntry]
    leftover_discards: list[LeftoverWasteEntry]
    total_inventory_waste_value: Decimal
    total_leftover_servings_wasted: int
    period_start: datetime | None
    period_end: datetime | None


# Spend Trend Analytics
class SpendTrendPoint(BaseModel):
    period: str  # e.g., "2026-01" or "2026-W03"
    total_spent: Decimal
    receipt_count: int
    meal_count: int
    meal_cost: Decimal


class SpendTrendResponse(BaseModel):
    trends: list[SpendTrendPoint]
    granularity: str  # "daily", "weekly", "monthly"
    period_start: datetime
    period_end: datetime


# Restock Predictions
class RestockPrediction(BaseModel):
    ingredient_id: UUID
    ingredient_name: str
    current_quantity: Decimal
    unit: str
    average_daily_usage: Decimal
    days_until_empty: int | None  # None if no usage data
    predicted_runout_date: datetime | None
    recommended_restock_date: datetime | None  # A few days before runout


class RestockPredictionsResponse(BaseModel):
    predictions: list[RestockPrediction]
    household_id: UUID
    generated_at: datetime
