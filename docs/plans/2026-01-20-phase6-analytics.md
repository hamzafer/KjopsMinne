# Phase 6: Analytics & Polish Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extend analytics with cost-per-meal, waste tracking, spend trends, and restock predictions

**Architecture:** New analytics endpoints leveraging existing MealPlan, InventoryEvent, Leftover, and Receipt data. Service layer for complex calculations. Backend-first approach.

**Tech Stack:** FastAPI, SQLAlchemy 2.0 async, Pydantic v2, PostgreSQL

---

## Task 1: Create Analytics Schemas

**Files:**
- Create: `backend/src/schemas/analytics.py`

**Step 1: Create schema file with all analytics response models**

```python
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
```

**Step 2: Commit**

```bash
git add backend/src/schemas/analytics.py
git commit -m "feat(schemas): add extended analytics schemas"
```

---

## Task 2: Create Restock Predictor Service (TDD)

**Files:**
- Create: `backend/tests/test_restock_predictor.py`
- Create: `backend/src/services/restock_predictor.py`

**Step 1: Write failing tests**

```python
"""Tests for restock predictor service."""
from datetime import datetime, timedelta
from decimal import Decimal
from uuid import uuid4

from src.services.restock_predictor import RestockPredictor


class TestCalculateAverageDailyUsage:
    def test_calculate_usage_from_events(self):
        """Calculate average daily usage from consumption events."""
        predictor = RestockPredictor()

        events = [
            {"quantity_delta": Decimal("-100"), "created_at": datetime(2026, 1, 1)},
            {"quantity_delta": Decimal("-50"), "created_at": datetime(2026, 1, 8)},
            {"quantity_delta": Decimal("-150"), "created_at": datetime(2026, 1, 15)},
        ]

        # 300g consumed over 14 days = ~21.43g/day
        result = predictor.calculate_average_daily_usage(events)

        assert result > Decimal("21")
        assert result < Decimal("22")

    def test_calculate_usage_no_events(self):
        """Return zero for no consumption events."""
        predictor = RestockPredictor()
        result = predictor.calculate_average_daily_usage([])
        assert result == Decimal("0")

    def test_calculate_usage_single_event(self):
        """Handle single event gracefully."""
        predictor = RestockPredictor()
        events = [
            {"quantity_delta": Decimal("-100"), "created_at": datetime(2026, 1, 1)},
        ]
        # Single event, assume 7 days default period
        result = predictor.calculate_average_daily_usage(events)
        assert result > Decimal("0")


class TestPredictRunout:
    def test_predict_runout_date(self):
        """Predict when ingredient will run out."""
        predictor = RestockPredictor()

        result = predictor.predict_runout(
            current_quantity=Decimal("500"),
            average_daily_usage=Decimal("50"),
            from_date=datetime(2026, 1, 20),
        )

        assert result["days_until_empty"] == 10
        assert result["predicted_runout_date"] == datetime(2026, 1, 30)
        # Recommended restock 3 days before
        assert result["recommended_restock_date"] == datetime(2026, 1, 27)

    def test_predict_runout_no_usage(self):
        """Return None for no usage data."""
        predictor = RestockPredictor()

        result = predictor.predict_runout(
            current_quantity=Decimal("500"),
            average_daily_usage=Decimal("0"),
            from_date=datetime(2026, 1, 20),
        )

        assert result["days_until_empty"] is None
        assert result["predicted_runout_date"] is None

    def test_predict_runout_already_empty(self):
        """Handle already empty inventory."""
        predictor = RestockPredictor()

        result = predictor.predict_runout(
            current_quantity=Decimal("0"),
            average_daily_usage=Decimal("50"),
            from_date=datetime(2026, 1, 20),
        )

        assert result["days_until_empty"] == 0
        assert result["predicted_runout_date"] == datetime(2026, 1, 20)
```

**Step 2: Run tests (should fail)**

```bash
cd backend && uv run pytest tests/test_restock_predictor.py -v
```

**Step 3: Implement service**

```python
"""Restock predictor service."""
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Any


class RestockPredictor:
    """Predict ingredient restock needs."""

    def calculate_average_daily_usage(
        self, consumption_events: list[dict[str, Any]]
    ) -> Decimal:
        """Calculate average daily usage from consumption events.

        Args:
            consumption_events: List of events with quantity_delta and created_at

        Returns:
            Average daily consumption (positive value)
        """
        if not consumption_events:
            return Decimal("0")

        # Sum total consumption (negative deltas)
        total_consumed = sum(
            abs(Decimal(str(e["quantity_delta"])))
            for e in consumption_events
            if Decimal(str(e["quantity_delta"])) < 0
        )

        if total_consumed == Decimal("0"):
            return Decimal("0")

        # Calculate time span
        dates = [e["created_at"] for e in consumption_events]
        if len(dates) == 1:
            # Single event, assume 7 day period
            days = 7
        else:
            min_date = min(dates)
            max_date = max(dates)
            days = max((max_date - min_date).days, 1)

        return total_consumed / Decimal(str(days))

    def predict_runout(
        self,
        current_quantity: Decimal,
        average_daily_usage: Decimal,
        from_date: datetime,
        restock_buffer_days: int = 3,
    ) -> dict[str, Any]:
        """Predict when ingredient will run out.

        Args:
            current_quantity: Current inventory quantity
            average_daily_usage: Average daily consumption
            from_date: Date to predict from
            restock_buffer_days: Days before runout to recommend restock

        Returns:
            Dict with days_until_empty, predicted_runout_date, recommended_restock_date
        """
        if average_daily_usage <= Decimal("0"):
            return {
                "days_until_empty": None,
                "predicted_runout_date": None,
                "recommended_restock_date": None,
            }

        if current_quantity <= Decimal("0"):
            return {
                "days_until_empty": 0,
                "predicted_runout_date": from_date,
                "recommended_restock_date": from_date,
            }

        days_until_empty = int(current_quantity / average_daily_usage)
        runout_date = from_date + timedelta(days=days_until_empty)
        restock_date = from_date + timedelta(days=max(0, days_until_empty - restock_buffer_days))

        return {
            "days_until_empty": days_until_empty,
            "predicted_runout_date": runout_date,
            "recommended_restock_date": restock_date,
        }
```

**Step 4: Run tests (should pass)**

```bash
cd backend && uv run pytest tests/test_restock_predictor.py -v
```

**Step 5: Commit**

```bash
git add backend/src/services/restock_predictor.py backend/tests/test_restock_predictor.py
git commit -m "feat(services): add RestockPredictor with TDD"
```

---

## Task 3: Add Cost Per Meal Endpoint

**Files:**
- Modify: `backend/src/api/analytics.py`

**Step 1: Add imports and endpoint**

```python
from uuid import UUID

from src.db.models import Category, Item, MealPlan, Receipt, Recipe
from src.schemas.analytics import CostPerMealResponse, MealCostEntry


@router.get("/analytics/cost-per-meal", response_model=CostPerMealResponse)
async def get_cost_per_meal(
    db: DbSession,
    household_id: UUID,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
):
    """Get cost analytics for cooked meals."""
    from sqlalchemy.orm import selectinload

    query = (
        select(MealPlan)
        .where(
            MealPlan.household_id == household_id,
            MealPlan.status == "cooked",
            MealPlan.actual_cost.isnot(None),
        )
        .options(selectinload(MealPlan.recipe))
        .order_by(MealPlan.cooked_at.desc())
    )

    if start_date:
        query = query.where(MealPlan.cooked_at >= start_date)
    if end_date:
        query = query.where(MealPlan.cooked_at <= end_date)

    result = await db.execute(query)
    meal_plans = result.scalars().all()

    meals = [
        MealCostEntry(
            meal_plan_id=mp.id,
            recipe_name=mp.recipe.name if mp.recipe else "Unknown",
            planned_date=mp.planned_date,
            servings=mp.servings,
            actual_cost=mp.actual_cost or Decimal("0"),
            cost_per_serving=mp.cost_per_serving or Decimal("0"),
        )
        for mp in meal_plans
    ]

    total_cost = sum(m.actual_cost for m in meals)
    total_servings = sum(m.servings for m in meals)

    return CostPerMealResponse(
        meals=meals,
        total_meals=len(meals),
        total_cost=total_cost,
        average_cost_per_meal=total_cost / len(meals) if meals else Decimal("0"),
        average_cost_per_serving=total_cost / total_servings if total_servings > 0 else Decimal("0"),
        period_start=min(m.planned_date for m in meals) if meals else None,
        period_end=max(m.planned_date for m in meals) if meals else None,
    )
```

**Step 2: Commit**

```bash
git add backend/src/api/analytics.py
git commit -m "feat(api): add cost-per-meal analytics endpoint"
```

---

## Task 4: Add Waste Analytics Endpoint

**Files:**
- Modify: `backend/src/api/analytics.py`

**Step 1: Add waste endpoint**

```python
from src.db.models import Ingredient, InventoryEvent, InventoryLot, Leftover
from src.schemas.analytics import LeftoverWasteEntry, WasteEntry, WasteResponse


@router.get("/analytics/waste", response_model=WasteResponse)
async def get_waste_analytics(
    db: DbSession,
    household_id: UUID,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
):
    """Get waste analytics including discarded inventory and leftovers."""
    from sqlalchemy.orm import selectinload

    # Get discarded inventory events
    inv_query = (
        select(InventoryEvent)
        .join(InventoryLot, InventoryEvent.lot_id == InventoryLot.id)
        .where(
            InventoryLot.household_id == household_id,
            InventoryEvent.event_type == "discard",
        )
        .options(
            selectinload(InventoryEvent.lot).selectinload(InventoryLot.ingredient)
        )
        .order_by(InventoryEvent.created_at.desc())
    )

    if start_date:
        inv_query = inv_query.where(InventoryEvent.created_at >= start_date)
    if end_date:
        inv_query = inv_query.where(InventoryEvent.created_at <= end_date)

    inv_result = await db.execute(inv_query)
    inv_events = inv_result.scalars().all()

    inventory_discards = []
    total_waste_value = Decimal("0")

    for event in inv_events:
        lot = event.lot
        quantity = abs(event.quantity_delta)
        # Estimate value based on lot's unit cost
        estimated_value = quantity * lot.unit_cost if lot.unit_cost else None

        if estimated_value:
            total_waste_value += estimated_value

        inventory_discards.append(
            WasteEntry(
                date=event.created_at,
                ingredient_name=lot.ingredient.name if lot.ingredient else None,
                quantity=quantity,
                unit=event.unit,
                reason=event.reason or "discarded",
                estimated_value=estimated_value,
            )
        )

    # Get discarded leftovers
    leftover_query = (
        select(Leftover)
        .where(
            Leftover.household_id == household_id,
            Leftover.status == "discarded",
        )
        .options(selectinload(Leftover.recipe))
        .order_by(Leftover.created_at.desc())
    )

    if start_date:
        leftover_query = leftover_query.where(Leftover.created_at >= start_date)
    if end_date:
        leftover_query = leftover_query.where(Leftover.created_at <= end_date)

    leftover_result = await db.execute(leftover_query)
    leftovers = leftover_result.scalars().all()

    leftover_discards = [
        LeftoverWasteEntry(
            leftover_id=lo.id,
            recipe_name=lo.recipe.name if lo.recipe else "Unknown",
            servings_wasted=lo.remaining_servings,
            created_at=lo.created_at,
            discarded_at=None,  # We don't track when it was marked discarded
        )
        for lo in leftovers
    ]

    total_servings_wasted = sum(lo.remaining_servings for lo in leftovers)

    return WasteResponse(
        inventory_discards=inventory_discards,
        leftover_discards=leftover_discards,
        total_inventory_waste_value=total_waste_value,
        total_leftover_servings_wasted=total_servings_wasted,
        period_start=start_date,
        period_end=end_date,
    )
```

**Step 2: Commit**

```bash
git add backend/src/api/analytics.py
git commit -m "feat(api): add waste analytics endpoint"
```

---

## Task 5: Add Spend Trend Endpoint

**Files:**
- Modify: `backend/src/api/analytics.py`

**Step 1: Add spend trend endpoint**

```python
from fastapi import Query
from src.schemas.analytics import SpendTrendPoint, SpendTrendResponse


@router.get("/analytics/spend-trend", response_model=SpendTrendResponse)
async def get_spend_trend(
    db: DbSession,
    household_id: UUID,
    start_date: datetime,
    end_date: datetime,
    granularity: str = Query("weekly", regex="^(daily|weekly|monthly)$"),
):
    """Get spending trends over time."""
    # Determine date truncation based on granularity
    if granularity == "daily":
        date_format = "YYYY-MM-DD"
        trunc_func = func.date_trunc("day", Receipt.purchase_date)
    elif granularity == "weekly":
        date_format = "IYYY-IW"  # ISO week
        trunc_func = func.date_trunc("week", Receipt.purchase_date)
    else:  # monthly
        date_format = "YYYY-MM"
        trunc_func = func.date_trunc("month", Receipt.purchase_date)

    # Receipt spending by period
    receipt_query = (
        select(
            trunc_func.label("period"),
            func.sum(Receipt.total_amount).label("total_spent"),
            func.count(Receipt.id).label("receipt_count"),
        )
        .where(
            Receipt.household_id == household_id,
            Receipt.purchase_date >= start_date,
            Receipt.purchase_date <= end_date,
        )
        .group_by(trunc_func)
        .order_by(trunc_func)
    )

    receipt_result = await db.execute(receipt_query)
    receipt_data = {row.period: row for row in receipt_result.all()}

    # Meal costs by period
    meal_query = (
        select(
            trunc_func.label("period"),
            func.sum(MealPlan.actual_cost).label("meal_cost"),
            func.count(MealPlan.id).label("meal_count"),
        )
        .where(
            MealPlan.household_id == household_id,
            MealPlan.status == "cooked",
            MealPlan.cooked_at >= start_date,
            MealPlan.cooked_at <= end_date,
        )
        .group_by(trunc_func)
        .order_by(trunc_func)
    )

    meal_result = await db.execute(meal_query)
    meal_data = {row.period: row for row in meal_result.all()}

    # Combine data points
    all_periods = sorted(set(receipt_data.keys()) | set(meal_data.keys()))

    trends = []
    for period in all_periods:
        receipt_row = receipt_data.get(period)
        meal_row = meal_data.get(period)

        # Format period string
        if granularity == "daily":
            period_str = period.strftime("%Y-%m-%d")
        elif granularity == "weekly":
            period_str = period.strftime("%Y-W%W")
        else:
            period_str = period.strftime("%Y-%m")

        trends.append(
            SpendTrendPoint(
                period=period_str,
                total_spent=Decimal(str(receipt_row.total_spent)) if receipt_row else Decimal("0"),
                receipt_count=receipt_row.receipt_count if receipt_row else 0,
                meal_count=meal_row.meal_count if meal_row else 0,
                meal_cost=Decimal(str(meal_row.meal_cost)) if meal_row and meal_row.meal_cost else Decimal("0"),
            )
        )

    return SpendTrendResponse(
        trends=trends,
        granularity=granularity,
        period_start=start_date,
        period_end=end_date,
    )
```

**Step 2: Commit**

```bash
git add backend/src/api/analytics.py
git commit -m "feat(api): add spend-trend analytics endpoint"
```

---

## Task 6: Add Restock Predictions Endpoint

**Files:**
- Modify: `backend/src/api/deps.py`
- Modify: `backend/src/api/analytics.py`

**Step 1: Add RestockPredictor dependency to deps.py**

```python
from src.services.restock_predictor import RestockPredictor

def get_restock_predictor() -> RestockPredictor:
    return RestockPredictor()

RestockPredictorDep = Annotated[RestockPredictor, Depends(get_restock_predictor)]
```

**Step 2: Add restock predictions endpoint**

```python
from src.api.deps import DbSession, RestockPredictorDep
from src.schemas.analytics import RestockPrediction, RestockPredictionsResponse


@router.get("/analytics/restock-predictions", response_model=RestockPredictionsResponse)
async def get_restock_predictions(
    db: DbSession,
    predictor: RestockPredictorDep,
    household_id: UUID,
):
    """Get restock predictions for inventory items."""
    from sqlalchemy.orm import selectinload

    # Get all ingredients with inventory
    inv_query = (
        select(
            InventoryLot.ingredient_id,
            Ingredient.name,
            func.sum(InventoryLot.quantity).label("total_quantity"),
            InventoryLot.unit,
        )
        .join(Ingredient, InventoryLot.ingredient_id == Ingredient.id)
        .where(
            InventoryLot.household_id == household_id,
            InventoryLot.quantity > 0,
        )
        .group_by(InventoryLot.ingredient_id, Ingredient.name, InventoryLot.unit)
    )

    inv_result = await db.execute(inv_query)
    inventory_items = inv_result.all()

    predictions = []
    now = datetime.now()

    for item in inventory_items:
        # Get consumption events for this ingredient (last 30 days)
        events_query = (
            select(InventoryEvent.quantity_delta, InventoryEvent.created_at)
            .join(InventoryLot, InventoryEvent.lot_id == InventoryLot.id)
            .where(
                InventoryLot.household_id == household_id,
                InventoryLot.ingredient_id == item.ingredient_id,
                InventoryEvent.event_type == "consume",
                InventoryEvent.created_at >= now - timedelta(days=30),
            )
        )

        events_result = await db.execute(events_query)
        events = [
            {"quantity_delta": e.quantity_delta, "created_at": e.created_at}
            for e in events_result.all()
        ]

        avg_usage = predictor.calculate_average_daily_usage(events)
        runout_info = predictor.predict_runout(
            current_quantity=Decimal(str(item.total_quantity)),
            average_daily_usage=avg_usage,
            from_date=now,
        )

        predictions.append(
            RestockPrediction(
                ingredient_id=item.ingredient_id,
                ingredient_name=item.name,
                current_quantity=Decimal(str(item.total_quantity)),
                unit=item.unit,
                average_daily_usage=avg_usage,
                days_until_empty=runout_info["days_until_empty"],
                predicted_runout_date=runout_info["predicted_runout_date"],
                recommended_restock_date=runout_info["recommended_restock_date"],
            )
        )

    # Sort by days until empty (soonest first, None at end)
    predictions.sort(
        key=lambda p: (p.days_until_empty is None, p.days_until_empty or 999)
    )

    return RestockPredictionsResponse(
        predictions=predictions,
        household_id=household_id,
        generated_at=now,
    )
```

**Step 3: Commit**

```bash
git add backend/src/api/deps.py backend/src/api/analytics.py
git commit -m "feat(api): add restock-predictions analytics endpoint"
```

---

## Task 7: Run All Tests

**Step 1: Run all tests**

```bash
cd backend && uv run pytest -v
```

**Step 2: Run linting**

```bash
cd backend && uv run ruff check .
```

**Expected:** All tests pass, no linting errors.

---

## Summary

Phase 6 adds extended analytics:

| Endpoint | Description |
|----------|-------------|
| GET /api/analytics/cost-per-meal | Cost analysis for cooked meals |
| GET /api/analytics/waste | Discarded inventory and leftovers |
| GET /api/analytics/spend-trend | Spending trends over time |
| GET /api/analytics/restock-predictions | Predict ingredient restocking needs |

Key features:
- Cost per meal and per serving analysis
- Waste tracking for inventory discards and expired leftovers
- Spending trends with daily/weekly/monthly granularity
- Smart restock predictions based on consumption patterns
