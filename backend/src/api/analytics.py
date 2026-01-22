from datetime import datetime, timedelta
from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Query
from pydantic import BaseModel
from sqlalchemy import func, select

from src.api.deps import DbSession, RestockPredictorDep
from src.db.models import (
    Category,
    Ingredient,
    InventoryEvent,
    InventoryLot,
    Item,
    Leftover,
    MealPlan,
    Receipt,
)
from src.schemas.analytics import (
    CostPerMealResponse,
    LeftoverWasteEntry,
    MealCostEntry,
    RestockPrediction,
    RestockPredictionsResponse,
    SpendTrendPoint,
    SpendTrendResponse,
    WasteEntry,
    WasteResponse,
)

router = APIRouter()


class SummaryResponse(BaseModel):
    total_receipts: int
    total_spent: Decimal
    total_items: int
    avg_receipt_amount: Decimal
    period_start: datetime | None
    period_end: datetime | None


class CategorySpending(BaseModel):
    category_name: str
    category_color: str | None
    total_spent: Decimal
    item_count: int


class ByCategory(BaseModel):
    categories: list[CategorySpending]
    uncategorized_total: Decimal
    uncategorized_count: int


class TopItemEntry(BaseModel):
    item_name: str
    total_spent: Decimal
    total_quantity: Decimal
    purchase_count: int
    unit: str | None
    average_price: Decimal


class TopItemsResponse(BaseModel):
    items: list[TopItemEntry]
    total_items: int
    sort_by: str
    period_start: datetime | None
    period_end: datetime | None


class StoreSpending(BaseModel):
    store_name: str
    total_spent: Decimal
    receipt_count: int
    avg_receipt: Decimal
    last_visit: datetime | None


class ByStoreResponse(BaseModel):
    stores: list[StoreSpending]
    period_start: datetime | None
    period_end: datetime | None


@router.get("/analytics/summary", response_model=SummaryResponse)
async def get_summary(
    db: DbSession,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
):
    """Get spending summary for a period."""
    query = select(
        func.count(Receipt.id).label("total_receipts"),
        func.coalesce(func.sum(Receipt.total_amount), 0).label("total_spent"),
        func.min(Receipt.purchase_date).label("period_start"),
        func.max(Receipt.purchase_date).label("period_end"),
    )

    if start_date:
        query = query.where(Receipt.purchase_date >= start_date)
    if end_date:
        query = query.where(Receipt.purchase_date <= end_date)

    result = await db.execute(query)
    row = result.one()

    # Get total items
    items_query = select(func.count(Item.id))
    if start_date or end_date:
        items_query = items_query.join(Receipt)
        if start_date:
            items_query = items_query.where(Receipt.purchase_date >= start_date)
        if end_date:
            items_query = items_query.where(Receipt.purchase_date <= end_date)

    items_result = await db.execute(items_query)
    total_items = items_result.scalar() or 0

    total_receipts = row.total_receipts or 0
    total_spent = Decimal(str(row.total_spent or 0))
    avg_amount = total_spent / total_receipts if total_receipts > 0 else Decimal("0")

    return SummaryResponse(
        total_receipts=total_receipts,
        total_spent=total_spent,
        total_items=total_items,
        avg_receipt_amount=avg_amount.quantize(Decimal("0.01")),
        period_start=row.period_start,
        period_end=row.period_end,
    )


@router.get("/analytics/by-category", response_model=ByCategory)
async def get_by_category(
    db: DbSession,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
):
    """Get spending breakdown by category."""
    # Categorized items
    query = (
        select(
            Category.name,
            Category.color,
            func.sum(Item.total_price).label("total_spent"),
            func.count(Item.id).label("item_count"),
        )
        .join(Item, Item.category_id == Category.id)
        .join(Receipt, Item.receipt_id == Receipt.id)
        .group_by(Category.id, Category.name, Category.color)
        .order_by(func.sum(Item.total_price).desc())
    )

    if start_date:
        query = query.where(Receipt.purchase_date >= start_date)
    if end_date:
        query = query.where(Receipt.purchase_date <= end_date)

    result = await db.execute(query)
    categories = [
        CategorySpending(
            category_name=row.name,
            category_color=row.color,
            total_spent=Decimal(str(row.total_spent)),
            item_count=row.item_count,
        )
        for row in result.all()
    ]

    # Uncategorized items
    uncat_query = select(
        func.coalesce(func.sum(Item.total_price), 0).label("total"),
        func.count(Item.id).label("count"),
    ).where(Item.category_id.is_(None))

    if start_date or end_date:
        uncat_query = uncat_query.join(Receipt, Item.receipt_id == Receipt.id)
        if start_date:
            uncat_query = uncat_query.where(Receipt.purchase_date >= start_date)
        if end_date:
            uncat_query = uncat_query.where(Receipt.purchase_date <= end_date)

    uncat_result = await db.execute(uncat_query)
    uncat_row = uncat_result.one()

    return ByCategory(
        categories=categories,
        uncategorized_total=Decimal(str(uncat_row.total or 0)),
        uncategorized_count=uncat_row.count or 0,
    )


@router.get("/analytics/top-items", response_model=TopItemsResponse)
async def get_top_items(
    db: DbSession,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    sort_by: str = Query("spend", pattern="^(spend|count)$"),
    limit: int = Query(10, ge=1, le=50),
):
    """Get top purchased items by spend or frequency."""
    # Use canonical_name if available, otherwise raw_name
    item_name = func.coalesce(Item.canonical_name, Item.raw_name)

    query = (
        select(
            item_name.label("item_name"),
            func.sum(Item.total_price).label("total_spent"),
            func.sum(Item.quantity).label("total_quantity"),
            func.count(Item.id).label("purchase_count"),
            func.max(Item.unit).label("unit"),  # Take any unit (assuming consistent)
        )
        .join(Receipt, Item.receipt_id == Receipt.id)
        .where(Item.is_pant == False)  # Exclude bottle deposits  # noqa: E712
        .group_by(item_name)
    )

    if start_date:
        query = query.where(Receipt.purchase_date >= start_date)
    if end_date:
        query = query.where(Receipt.purchase_date <= end_date)

    # Order by spend or count
    if sort_by == "spend":
        query = query.order_by(func.sum(Item.total_price).desc())
    else:
        query = query.order_by(func.count(Item.id).desc())

    query = query.limit(limit)

    result = await db.execute(query)
    rows = result.all()

    items = [
        TopItemEntry(
            item_name=row.item_name,
            total_spent=Decimal(str(row.total_spent)),
            total_quantity=Decimal(str(row.total_quantity or 0)),
            purchase_count=row.purchase_count,
            unit=row.unit,
            average_price=(
                Decimal(str(row.total_spent)) / row.purchase_count
                if row.purchase_count > 0
                else Decimal("0")
            ).quantize(Decimal("0.01")),
        )
        for row in rows
    ]

    return TopItemsResponse(
        items=items,
        total_items=len(items),
        sort_by=sort_by,
        period_start=start_date,
        period_end=end_date,
    )


@router.get("/analytics/by-store", response_model=ByStoreResponse)
async def get_by_store(
    db: DbSession,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
):
    """Get spending breakdown by store/merchant."""
    # Normalize store names: uppercase, trim whitespace
    store_name = func.upper(func.trim(Receipt.merchant_name))

    query = (
        select(
            store_name.label("store_name"),
            func.sum(Receipt.total_amount).label("total_spent"),
            func.count(Receipt.id).label("receipt_count"),
            func.max(Receipt.purchase_date).label("last_visit"),
        )
        .where(Receipt.merchant_name.isnot(None))
        .group_by(store_name)
        .order_by(func.sum(Receipt.total_amount).desc())
    )

    if start_date:
        query = query.where(Receipt.purchase_date >= start_date)
    if end_date:
        query = query.where(Receipt.purchase_date <= end_date)

    result = await db.execute(query)
    rows = result.all()

    stores = [
        StoreSpending(
            store_name=row.store_name,
            total_spent=Decimal(str(row.total_spent)),
            receipt_count=row.receipt_count,
            avg_receipt=(
                Decimal(str(row.total_spent)) / row.receipt_count
                if row.receipt_count > 0
                else Decimal("0")
            ).quantize(Decimal("0.01")),
            last_visit=row.last_visit,
        )
        for row in rows
    ]

    return ByStoreResponse(
        stores=stores,
        period_start=start_date,
        period_end=end_date,
    )


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
        average_cost_per_serving=(
            total_cost / total_servings if total_servings > 0 else Decimal("0")
        ),
        period_start=min(m.planned_date for m in meals) if meals else None,
        period_end=max(m.planned_date for m in meals) if meals else None,
    )


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
        .options(selectinload(InventoryEvent.lot).selectinload(InventoryLot.ingredient))
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


@router.get("/analytics/spend-trend", response_model=SpendTrendResponse)
async def get_spend_trend(
    db: DbSession,
    household_id: UUID,
    start_date: datetime,
    end_date: datetime,
    granularity: str = Query("weekly", pattern="^(daily|weekly|monthly)$"),
):
    """Get spending trends over time."""
    # Determine date truncation based on granularity
    if granularity == "daily":
        trunc_func = func.date_trunc("day", Receipt.purchase_date)
    elif granularity == "weekly":
        trunc_func = func.date_trunc("week", Receipt.purchase_date)
    else:  # monthly
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

    # Meal costs by period (use MealPlan.cooked_at for the trunc)
    meal_trunc_func = func.date_trunc(
        "day" if granularity == "daily" else "week" if granularity == "weekly" else "month",
        MealPlan.cooked_at,
    )

    meal_query = (
        select(
            meal_trunc_func.label("period"),
            func.sum(MealPlan.actual_cost).label("meal_cost"),
            func.count(MealPlan.id).label("meal_count"),
        )
        .where(
            MealPlan.household_id == household_id,
            MealPlan.status == "cooked",
            MealPlan.actual_cost.isnot(None),
            MealPlan.cooked_at >= start_date,
            MealPlan.cooked_at <= end_date,
        )
        .group_by(meal_trunc_func)
        .order_by(meal_trunc_func)
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
            period_str = period.strftime("%G-W%V")
        else:
            period_str = period.strftime("%Y-%m")

        trends.append(
            SpendTrendPoint(
                period=period_str,
                total_spent=Decimal(str(receipt_row.total_spent)) if receipt_row else Decimal("0"),
                receipt_count=receipt_row.receipt_count if receipt_row else 0,
                meal_count=meal_row.meal_count if meal_row else 0,
                meal_cost=(
                    Decimal(str(meal_row.meal_cost))
                    if meal_row and meal_row.meal_cost
                    else Decimal("0")
                ),
            )
        )

    return SpendTrendResponse(
        trends=trends,
        granularity=granularity,
        period_start=start_date,
        period_end=end_date,
    )


@router.get("/analytics/restock-predictions", response_model=RestockPredictionsResponse)
async def get_restock_predictions(
    db: DbSession,
    predictor: RestockPredictorDep,
    household_id: UUID,
):
    """Get restock predictions for inventory items."""
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

    # Fetch all consumption events for these ingredients in one query
    ingredient_ids = [item.ingredient_id for item in inventory_items]
    if ingredient_ids:
        events_query = (
            select(
                InventoryEvent.quantity_delta,
                InventoryEvent.created_at,
                InventoryLot.ingredient_id,
            )
            .join(InventoryLot, InventoryEvent.lot_id == InventoryLot.id)
            .where(
                InventoryLot.household_id == household_id,
                InventoryLot.ingredient_id.in_(ingredient_ids),
                InventoryEvent.event_type == "consume",
                InventoryEvent.created_at >= now - timedelta(days=30),
            )
        )
        events_result = await db.execute(events_query)

        # Group events by ingredient_id
        events_by_ingredient: dict[UUID, list[dict]] = {}
        for row in events_result.all():
            ing_id = row.ingredient_id
            if ing_id not in events_by_ingredient:
                events_by_ingredient[ing_id] = []
            events_by_ingredient[ing_id].append(
                {
                    "quantity_delta": row.quantity_delta,
                    "created_at": row.created_at,
                }
            )
    else:
        events_by_ingredient = {}

    for item in inventory_items:
        events = events_by_ingredient.get(item.ingredient_id, [])

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
    predictions.sort(key=lambda p: (p.days_until_empty is None, p.days_until_empty or 999))

    return RestockPredictionsResponse(
        predictions=predictions,
        household_id=household_id,
        generated_at=now,
    )
